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
  
    return { updateRateLimits: updateRateLimits, payload: payload };
  }
}