'use strict';

const worker = require('./worker');

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

var db = admin.firestore();

const MAX_NOTIFICATIONS_PER_DAY = 100;

exports.sendPushNotification = functions.https.onRequest(async (req, res) => {
    return handleRequest(req, res, worker.createLegacyPayload);
});

exports.pushNotifyV2 = functions.https.onRequest(async (req, res) => {
    return handleRequest(req, res, worker.createPayload);
});

async function handleRequest(req, res, payloadHandler) {
    if (debug()) console.log('Received payload', req.body);
    var today = getToday();
    var token = req.body.push_token;
    if (!token) {
        return res.status(403).send({ 'errorMessage': 'Missed token' });
    }
    if (token.indexOf(':') === -1) {
        return res.status(403).send({'errorMessage': 'Invalid token'});
    }

    var workerResult = payloadHandler(req);
    var updateRateLimits = workerResult.updateRateLimits;
    var payload = workerResult.payload;

    payload['token'] = token;

    var ref = db.collection('rateLimitsV2').doc(today).collection('tokens').doc(token);

    var docExists = false;
    var docData = {
        deliveredCount: 0,
        errorCount: 0,
        totalCount: 0,
    };

    try {
        var currentDoc = await ref.get();
        docExists = currentDoc.exists;
        if (currentDoc.exists) {
            docData = currentDoc.data();
        }
    } catch(err) {
        console.error('Error getting document', err);
        return handleError(res, 'getDoc', err);
    }

    if (updateRateLimits && docData.deliveredCount > MAX_NOTIFICATIONS_PER_DAY) {
        return res.status(429).send({
            errorType: 'RateLimited',
            message: 'You have exited the maximum number of notifications allowed per day. Please try again later.',
            target: token,
            rateLimits: getRateLimitsObject(docData),
        });
    }

    docData.totalCount = docData.totalCount + 1;

    if (debug) console.log('Sending payload', JSON.stringify(payload));

    var messageId;
    try {
        messageId = await admin.messaging().send(payload);
        docData.deliveredCount = docData.deliveredCount + 1;
    } catch(err) {
        docData.errorCount = docData.errorCount + 1;
        await writeRateLimits(ref, docExists, docData, res);
        return handleError(res, payload, 'sendNotification', err);
    }

    if (debug()) console.log('Successfully sent message:', messageId);

    if (updateRateLimits) {
        await writeRateLimits(ref, docExists, docData, res);
    } else {
        if (debug) console.log('Not updating rate limits because notification is critical or command');
    }

    return res.status(201).send({
        messageId: messageId,
        sentPayload: payload,
        target: token,
        rateLimits: getRateLimitsObject(docData),
    });

};

async function writeRateLimits(ref, docExists, docData, res) {
    try {
        if (docExists) {
            if (debug()) console.log('Updating existing doc');
            await ref.update(docData);
        } else {
            if (debug()) console.log('Creating new doc');
            await ref.set(docData);
        }
    } catch(err) {
        if (docExists) {
            console.error('Error updating document', err);
        } else {
            console.error('Error creating document', err);
        }
        return handleError(res, 'setDocument', err);
    }
    return true;
}

function handleError(res, payload, step, incomingError) {
    if (!incomingError) return null;
    if (payload) {
        console.error('InternalError during', step, 'with payload', JSON.stringify(payload), incomingError);
    } else {
        console.error('InternalError during', step, incomingError);
    }
    return res.status(500).send({
        errorType: 'InternalError',
        errorStep: step,
        message: incomingError.message,
    });
}

function getToday() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  return yyyy + mm + dd;
}

function getRateLimitsObject(doc) {
    var d = new Date();
    var remainingCount = (MAX_NOTIFICATIONS_PER_DAY - doc.deliveredCount);
    if (remainingCount === -1) remainingCount = 0;
    return {
        successful: (doc.deliveredCount || 0),
        errors: (doc.errorCount || 0),
        total: (doc.totalCount || 0),
        maximum: MAX_NOTIFICATIONS_PER_DAY,
        remaining: remainingCount,
        resetsAt: new Date(d.getFullYear(), d.getMonth(), d.getDate()+1)
    };
}

function debug() {
    return false;
}