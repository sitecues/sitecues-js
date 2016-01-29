define([], function () {

  var constants = {};

  constants.READY_STATE = {
    INITIALIZING: 0,
    COMPLETE: 1
  };

  constants.METRIC_NAME = {
    TTS_REQUEST: 'tts-requested',
    PANEL_FOCUS_MOVE: 'panel-focus-moved',
    PANEL_CLICK: 'panel-clicked',
    PANEL_CLOSE: 'panel-closed',
    FEEDBACK: 'feedback-send',
    SLIDER_SETTING_CHANGE: 'slider-setting-changed',
    BADGE_HOVER: 'badge-hovered',
    PAGE_VISIT: 'page-visited',
    LENS_OPEN: 'hlb-opened',
    KEY_COMMAND: 'key-command',
    ZOOM_CHANGE: 'zoom-changed'
  };

  return constants;

});