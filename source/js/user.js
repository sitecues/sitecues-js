// This module includes functionality used in user identification.
sitecues.def('user', function (user, callback, log) {
  var userId = null;

  user.getId = function() {
    return userId;
  };

  sitecues.use('jquery', function(jquery) {
    jquery.ajax({
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      beforeSend: function(xhrObj){
        xhrObj.setRequestHeader("Accept","application/json");
      },
      url: '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/user/id/get.json',
      type: "GET",
      success: function(data) {
        userId = data.userId;
        callback();
      },
      error: function(xhr, textStatus, errorThrown) {
        console.log('===== Unable to get user ID: ' + textStatus);
        callback();
      }
    });
  })
});
