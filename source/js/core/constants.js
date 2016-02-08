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
    FEEDBACK: 'feedback-sent',
    SLIDER_SETTING_CHANGE: 'slider-setting-changed',
    BADGE_HOVER: 'badge-hovered',
    PAGE_VISIT: 'page-visited',
    LENS_OPEN: 'hlb-opened',
    KEY_COMMAND: 'key-command',
    ZOOM_CHANGE: 'zoom-changed'
  };

  constants.KEY_CODE = {
    MINUS_ALT1: 173,
    MINUS_ALT2: 45,
    MINUS_ALT3: 189,
    EQUALS_ALT1: 187,
    EQUALS_ALT2: 61,
    PLUS: 43,
    NUMPAD_SUBTRACT: 109,
    NUMPAD_ADD: 107,
    NUMPAD_0: 48,
    NUMPAD_1: 97,
    NUMPAD_2: 98,
    NUMPAD_3: 99,
    NUMPAD_4: 100,
    NUMPAD_6: 102,
    NUMPAD_7: 103,
    NUMPAD_8: 104,
    NUMPAD_9: 105,
    QUOTE: 222,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    LETTER_H: 72,
    SHIFT: 16,
    F8: 119,
    TAB: 9,
    ENTER: 13
  };

  constants.ZOOM_OUT_CODES = [
    constants.KEY_CODE.MINUS_ALT1,
    constants.KEY_CODE.MINUS_ALT2,
    constants.KEY_CODE.MINUS_ALT3,
    constants.KEY_CODE.NUMPAD_SUBTRACT
  ];

  constants.ZOOM_IN_CODES = [
    constants.KEY_CODE.EQUALS_ALT1,
    constants.KEY_CODE.EQUALS_ALT2,
    constants.KEY_CODE.PLUS,
    constants.KEY_CODE.NUMPAD_ADD
  ];

  constants.INIT_CODES = [constants.KEY_CODE.QUOTE]
    .concat(constants.ZOOM_IN_CODES, constants.ZOOM_OUT_CODES);

  return constants;

});