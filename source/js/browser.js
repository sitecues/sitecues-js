/**
 * Determines which browser we are running and which capabilities it has.
 * Ideally we should operate on capabilities, but often we need to be browser
 * or even version-specific.
*/
sitecues.def('browser', function (browserModule, callback, log) {
  'use strict';

  var agent = navigator && navigator.userAgent ? navigator.userAgent : null ;

  browserModule = {
    zoom      : 'zoom' in document.createElement('div').style,
    isFirefox : agent.indexOf(' Firefox/') > 0 ? true : false,
    isIE      : agent.indexOf(' MSIE') > 0 || agent.indexOf(' Trident') > 0 ? true : false
  };

  // done
  callback();

});