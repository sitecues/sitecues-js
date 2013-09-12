/**
 * Determines which browser we are running and which capabilities it has.
 * Ideally we should operate on capabilities, but often we need to be browser
 * or even version-specific.
*/
sitecues.def('browser', function (browser, callback, log) {

  browser.zoom = 'zoom' in document.createElement('div').style;

  browser.isFirefox = function() {
    return navigator && navigator.userAgent && navigator.userAgent.indexOf(' Firefox/') > 0;
  }

  // done
  callback();

});
