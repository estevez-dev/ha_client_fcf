module.exports = {
  createPayload: function createPayload(req) {
    var payload = {
      android: {
        collapseKey: "haclient"
      },
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
        payload.android.ttl = req.body.data.ttl;
      }
      
      // https://firebase.google.com/docs/reference/admin/node/admin.messaging.AndroidConfig.html#optional-priority
      if (req.body.data.priority) {
        payload.android.priority = req.body.data.priority;
      }
      
      if (req.body.data.image) {
        payload.notification.image = req.body.data.image;
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