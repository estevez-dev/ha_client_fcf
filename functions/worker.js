module.exports = {
  createPayload: function createPayload(req) {
    // Payload according to
    // https://firebase.google.com/docs/reference/admin/node/TokenMessage
    var payload = {
      android: {
        collapseKey: "haclient",
        notification: {
          icon: "mini_icon",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          channelId: "ha_notify"
        }
      },
      notification: {},
      data: {},
    };
    var updateRateLimits = true;
    
    if (req.body.message) {
      payload.notification.body = req.body.message;
    }
    
    if (req.body.title) {
      payload.notification.title = req.body.title;
    }
    
    // https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidNotification
    if (req.body.data) {
      if (req.body.data.image) {
        payload.notification.imageUrl = req.body.data.image;
      }
      for (const key of ['tag', 'color', 'channelId']) {
        if (req.body.data[key]) {
          payload.android.notification[key] = String(req.body.data[key])
        }
      }
    }
  
    return { updateRateLimits: updateRateLimits, payload: payload, collectionName: 'rateLimitsV2' };
  },
  
  createPayloadV3: function createPayload(req) {
    // Payload according to
    // https://firebase.google.com/docs/reference/admin/node/TokenMessage
    var payload = {
      data: {},
    };
    var updateRateLimits = true;
    
    if (req.body.message) {
      payload.data.body = req.body.message;
    }
    
    if (req.body.title) {
      payload.data.title = req.body.title;
    }
    
    // https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidNotification
    if (req.body.data) {
      if (req.body.data.image) {
        payload.data.imageUrl = req.body.data.image;
      }
      for (const key of ['color', 'channelId', 'image', 'tag', 'dismiss', 'autoDismiss']) {
        if (req.body.data[key] !== null && typeof req.body.data[key] !== 'undefined') {
          payload.data[key] = String(req.body.data[key])
        }
      }
      if (req.body.data['actions'] && req.body.data['actions'].length > 0) {
        for (var i = 1; i <= req.body.data['actions'].length; i++) {
          var action = req.body.data['actions'][i-1];
          payload.data['action' + i] = String(action.title);
          payload.data['action' + i + '_data'] = JSON.stringify(action);
        }
      }
    }
  
    return {updateRateLimits: updateRateLimits, payload: payload, collectionName: 'rateLimitsV3'};
  }
}