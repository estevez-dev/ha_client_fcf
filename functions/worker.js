module.exports = {
  createPayload: function createPayload(req) {
    var payload = {
      android: {},
      notification: {},
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },
    };
    var updateRateLimits = true;
    
    if (req.body.data) {
      // Allow setting of ttl
      // https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidConfig.html#optional-ttl
      if (req.body.data.ttl) {
        payload.android.ttl = req.body.data.ttl
      }
      
      // https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidConfig.html#optional-priority
      if (req.body.data.priority) {
          payload.android.priority = req.body.data.priority
      }
      
      // https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidNotification.html
      for (const key of [
        'icon', 'color', 'sound', 'tag', 'clickAction',
        'bodyLocKey', 'bodyLocArgs', 'titleLocKey', 'titleLocArgs', 'channelId',
        'ticker', 'sticky', 'eventTime', 'localOnly', 'notificationPriority',
        'defaultSound', 'defaultVibrateTimings', 'defaultLightSettings', 'vibrateTimings',
        'visibility', 'notificationCount', 'lightSettings', 'image']) {
        if (req.body.data[key]) {
          payload.data[key] = String(req.body.data[key])
        }
      }
    }
          
    if (req.body.message) {
      payload.data.message = req.body.message;
      if (req.body.message in ['request_location_update', 'clear_notification']) {
        updateRateLimits = false
      } else {
        payload.notification.body = req.body.message;
      }
    }
    
    if (req.body.title) {
      payload.data.title = req.body.title
      if (req.body.message in ['request_location_update', 'clear_notification']) {
        updateRateLimits = false
      } else {
        payload.notification.title = req.body.title;
      }
    }
  
    return { updateRateLimits: updateRateLimits, payload: payload };
  }
}