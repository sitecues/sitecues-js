define([
  'page/reset/reset',
  'page/keys/keys',
  'page/keys/commands',
  'page/util/element-classifier',
  'page/highlight/highlight',
  'page/util/common',
  'page/highlight/move-keys',
  'page/zoom/zoom',
  'page/hpan/hpan',
  'page/positioner/positioner',
  'page/focus/focus',
  'page/cursor/cursor',
  'page/zoom/util/body-geometry',
  'page/zoom/util/restrict-zoom',
  'page/viewport/viewport',
  'page/viewport/scrollbars',
  'page/zoom/config/config',
  'page/zoom/animation',
  'page/zoom/constants',
  'page/zoom/state',
  'page/zoom/style'
  ], function (reset) {

    function init() {
      reset.init();
    }
    return {
      init: init
    };
  }
);
