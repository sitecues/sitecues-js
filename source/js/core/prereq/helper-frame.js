// Create the Sitecues iframe used to get native methods and store global prefs
// Apologies for putting this on the native window
// Must be inserted before alameda by the build process

// jshint -W098
var _sc_getHelperFrame = function(id, optionalSrc) {
// jshint +W098
  var frame = document.getElementById(id);

  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = id;
    frame.setAttribute('aria-hidden', true);
    frame.setAttribute('role', 'presentation');
    frame.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;visibility:hidden;';
    // Set title and text description for iframe. Without this, accessibility tools fail,
    // even though they shouldn't given that it has aria-hidden="true" and says role="presentation".
    // But, customers rightly insist that we pass their tools.
    // The real point is that screen reader users either won't see the iframe, or if they do, it won't be a complete mystery.
    // We used a text phrase that does not need to be localized, just to save effort ... the word 'data' is pretty international.
    var SITECUES_IFRAME_TEXT = 'Sitecues data';
    frame.setAttribute('title', SITECUES_IFRAME_TEXT);
    frame.innerText = SITECUES_IFRAME_TEXT;  // Setting innerText doesn't seem to do anything here, but we're keeping it to be safe -- no real harm
    if (optionalSrc) {
      frame.src = optionalSrc;
    }
    document.documentElement.appendChild(frame);
  }

  return frame;
};
