// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
// Currently only needed for IE11
// Used for SitecuesPromiseError events, which help log errors that occur inside Sitecues promises
// Must be inserted before alameda by the build process
(function () {

  if ( typeof window.CustomEvent === "function" ) {
    return false;
  }

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
