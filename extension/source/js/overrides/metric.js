define('run/metric/metric', [], function() {
  "use strict";

  function noop() {}
  noop.send = function() {};

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
    SitecuesReady: noop,
    SliderSettingChange: noop,
    TtsRequest: noop,
    ZoomChange: noop
  };

});

