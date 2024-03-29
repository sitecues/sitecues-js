define(
  [
    'core/user',
    'core/session',
    'core/page-view'
  ],
  function(
    user,
    session,
    pageView
  ) {
  'use strict';

  var exports = { init: init };

  function init() {
    return user.getId().then(function (userId) {
      // Only the user id needs to be fetch asynchronously (it is retrieved from global storage)
      exports.session  = session.getId();
      exports.pageView = pageView.getId();
      exports.user     = userId;
      exports.isValid  = exports.session && exports.pageView && exports.user;
    });
  }

  return exports;
});
