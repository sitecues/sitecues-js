// This module includes functionality used in user identification.
sitecues.def('user', function(user, callback) {

  sitecues.use('util/localstorage', function(ls) {

    var userId = ls.getUserId();

    user.getId = function() {
      return userId;
    };

    if (userId) {
      callback();
    } else {
      if (SC_LOCAL) {
        // Cannot save to server when we have no access to it
        // Putting this condition in allows us to paste sitecues into the console
        // and test it on sites that have a content security policy
        ls.clearSitecuesLs();
        ls.setUserId('localuser');
        SC_DEV && console.log('Use localuser because we have no access to it.');
        callback();
        return;
      }
      SC_DEV && console.log('UserID not found in localStorage, fallback to ajax request.');
      sitecues.use('jquery', function(jquery) {
        jquery.ajax({
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true,
          beforeSend: function(xhrObj) {
            xhrObj.setRequestHeader("Accept", "application/json");
          },
          url: sitecues.getApiUrl('user/id/get.json'),
          type: 'GET',
          success: function(data) {
            userId = data.userId;
            ls.clearSitecuesLs();
            ls.setUserId(data.userId);
            callback();
          },
          error: function(xhr, textStatus) {
            if (SC_DEV) {
              console.log('===== Unable to get user ID: ' + textStatus);
            }
            callback();
          }
        });
      });
    }
  });
});
