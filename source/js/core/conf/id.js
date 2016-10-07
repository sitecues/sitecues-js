define(
  [
    'mini-core/user',
    'mini-core/session',
    'mini-core/page-view',
    'mini-core/site'
  ],
  function(
    user,
    session,
    pageView,
    site
  ) {
  'use strict';

  var exports = { init: init };

  function init() {
    return user.getId().then(function (userId) {
      // Only the user id needs to be fetch asynchronously (it is retrieved from global storage)
      exports.session  = session.getId();
      exports.pageView = pageView.getId();
      exports.user     = userId;
      exports.site     = site.getId();
    });
  }

  return exports;
});
