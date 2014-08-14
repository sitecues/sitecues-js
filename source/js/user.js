// This module includes functionality used in user identification.
sitecues.def('user', function(user, callback) {

  var userId = window.localStorage.getItem('userId') || null;

  user.getId = function() {
    return userId;
  };

  if (userId) {
    callback();
  } else {
    SC_DEV && console.log('UserID  not found in localStorage, fallback to ajax request.');
    sitecues.use('jquery', function(jquery) {
      jquery.ajax({
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true,
        beforeSend: function(xhrObj) {
          xhrObj.setRequestHeader("Accept", "application/json");
        },
        url: '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/user/id/get.json',
        type: "GET",
        success: function(data) {
          userId = data.userId;
          window.localStorage.setItem('userId', data.userId);
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
