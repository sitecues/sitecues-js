// This module includes functionality used in user identification.
define(['util/localstorage'], function(ls) {

  var isInitialized;

  function didComplete() {
    sitecues.emit('user-id/did-complete');
  }

  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    var userId = ls.getUserId();

    if (userId) {
      didComplete();
      return;
    }

    if (SC_LOCAL) {
      // Cannot save to server when we have no access to it
      // Putting this condition in allows us to paste sitecues into the console
      // and test it on sites that have a content security policy
      ls.clearSitecuesLs();
      ls.setUserId('localuser');
      SC_DEV && console.log('Use localuser because we have no access to it.');
      didComplete();
      return;
    }

    SC_DEV && console.log('UserID not found in localStorage, fallback to ajax request.');
    require(['util/xhr'], function (xhr) {
      xhr.getJSON({
        url: sitecues.getApiUrl('user/id/get.json'),
        success: function (data) {
          // Important MAGIC: this will also have set a cookie that ends up getting used in future requests
          // e.g. _ai2_sc_uid = 3d50a209-dc12-4bf4-9913-de5ba74f96cf
          // That's why nothing ever needs to check the user ID directly except for this module!!!
          userId = data.userId;
          ls.clearSitecuesLs();
          ls.setUserId(data.userId);
          didComplete();
        },
        error: function (textStatus) {
          if (SC_DEV) {
            console.log('===== Unable to get user ID: ' + textStatus);
          }
        }
      });
    });
  }

  return {
    init: init
  };
});
