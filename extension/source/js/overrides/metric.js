// We don't fire metrics for the extension because Google keeps taking us down -- we're concerned that
// any outgoing network calls may be bad.
// In addition, being able to turn off metrics for intranet customers of Sitecues Everywhere seems good
// TODO there is a way to use Google metrics in the developer dashboard for extensions, which we may want to use in the future
define('run/metric/metric', [], function() {
  "use strict";

  function noop() {
    return {
      send: function() {}
    };
  }

  return {
    init: noop,
    initViewInfo: noop,
    getMetricHistory: noop,
    BadgeHover: noop,
    Error: noop,
    Feedback: noop,
    KeyCommand: noop,
    LensOpen: noop,
    MouseShake: noop,
    OptionMenuOpen: noop,
    OptionMenuItemSelection: noop,
    PageClickFirst: noop,
    PageScrollFirst: noop,
    PageUnload: noop,
    PanelClick: noop,
    PanelClose: noop,
    PanelFocusMove: noop,
    PageVisit: noop,
    SliderSettingChange: noop,
    TtsRequest: noop,
    ZoomChange: noop
  };

});

