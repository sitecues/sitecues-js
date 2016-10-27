// focus enhancement (make focus easier to see)
define(
  [
    '$',
    'run/conf/preferences'
  ],
  function (
    $,
    pref
  ) {
  'use strict';

  var MIN_ZOOM = 1.4,   // minimum zoom at which focus enhancement appears
    FOCUS_RING_COLOR_ON_LIGHT = 'rgba(82,168,236,.8)',    // color of focus enhancement on normal/warm/bold theme
    FOCUS_RING_COLOR_ON_DARK = 'rgba(255,255,100,.8)',    // color of focus enhancement on dark theme
    $styleSheet = $(),
    zoomLevel = 1,
    isDark,
    isEnabled;

  // show focus enhancement
  function show() {
    // hide focus first to allow
    // recalculate outline thickness
    hide();

    var color = isDark ? FOCUS_RING_COLOR_ON_DARK : FOCUS_RING_COLOR_ON_LIGHT;

    // create style element
    // append focus css rule to it
    $styleSheet = $('<style>')
      // Note: using :not() helps avoid non-performant general descendant selector like 'body *'
      .html('*:not(html):not(body):not(#sitecues-badge):not([id^="scp-"]):focus{outline:0;box-shadow:0 0 3pt 2pt ' + color + ';}')
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

  function refresh(newZoomLevel, willBeDark) {
    // remember previous state of focus
    var wasEnabled = isEnabled,
      isColorChanging = willBeDark !== isDark;

    zoomLevel = newZoomLevel;
    isDark = willBeDark;

    // determinate should focus enhancement
    // be enabled or not
    isEnabled = newZoomLevel >= MIN_ZOOM || willBeDark;



    // if state of enhancement was changed
    // refresh module bindings on the page
    if (wasEnabled !== isEnabled || isColorChanging) {
      refreshFeatureEnablement();
    }
  }

  function init() {
    // subscribe to zoom changes and update
    // enhancement state with each change
    pref.bindListener('zoom', function (currZoom) {
      refresh(currZoom, isDark);
    });

    pref.bindListener('themeName', function (themeName) {
      refresh(zoomLevel, themeName === 'dark');
    });
  }

  return {
    init: init
  };
});