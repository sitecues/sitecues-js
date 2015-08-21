// focus enhancement (make focus easier to see)
define(['jquery', 'conf/user/manager'], function($, conf) {

  'use strict';

  var MIN_ZOOM = 1.4,   // minimum zoom at which focus enhancement appears
    FOCUS_RING_COLOR = 'rgba(82,168,236,.8)',    // color of focus enhancement
    $styleSheet = $(),
    isEnabled;

  // show focus enhancement
  function show() {
    // hide focus first to allow
    // recalculate outline thickness
    hide();

    // create style element
    // append focus css rule to it
    // Rounded, soft outline outside of element
    // TODO -- change z-index and use position: relative if statically positioned so outline on top
    // 'z-index: 999999; position: relative;' +
    $styleSheet = $('<style>')
      // Note: using :not() helps avoid non-performant general descendant selector like 'body *'
      .html('*:not(html):not(body):not(#sitecues-badge):not([id^="scp-"]):focus{box-shadow:0 0 3pt 2pt ' + FOCUS_RING_COLOR + ';}')
      .appendTo('head');
  }

  // hide focus enhancement
  function hide() {
    $styleSheet.remove();
  }

  // refresh focus enhancement bindings on the page
  function refreshFeatureEnablement (){
    if (isEnabled) {
      // if focus enhancement is enabled,
      // bind `blur` and `focus` events to
      // proper handlers. use selector for
      // filtering of matched elements
      show();
    } else {
      // unbind event handlers if focus
      // enhancement is disabled
      hide();
    }
  }

  // subscribe to zoom changes and update
  // enhancement state with each change
  conf.get('zoom', function(currZoom) {
    // remember previous state of focus
    var wasEnabled = isEnabled;

    // determinate should focus enhancement
    // be enabled or not
    isEnabled = currZoom >= MIN_ZOOM;

    // if state of enhancement was changed
    // refresh module bindings on the page
    if (wasEnabled !== isEnabled) {
      refreshFeatureEnablement();
    }
  });

  // No publics
});