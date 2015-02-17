sitecues.def('bp/constants', function (constants, callback) {

  'use strict';

  // TODO don't repeat this in styles.js

  constants.SMALL                    = 'scp-small';
  constants.LARGE                    = 'scp-large';

  // IDs

  constants.SMALL_A_ID               = 'scp-small-A';
  constants.LARGE_A_ID               = 'scp-large-A';
  constants.A_CLASS                  = 'scp-A-button';

  constants.SPEECH_ID                = 'scp-speech';
  constants.SPEECH_STATE_ID          = 'scp-speech-state';

  constants.MAIN_ID                  = 'scp-main';

  constants.MOUSEOVER_TARGET         = 'scp-mouseover-target'; // Mousing over this element causes BP to expand

  constants.SVG_ID                   = 'scp-svg';
  constants.BADGE_ID                 = 'sitecues-badge';
  constants.BP_CONTAINER_ID          = 'scp-bp-container';

  // Speech
  constants.HEAD_ID                  = 'scp-head';
  constants.SPEECH_LABEL_ID          = 'scp-speech-label';
  constants.ZOOM_LABEL_ID            = 'scp-zoom-label';
  constants.SPEECH_TARGET_ID         = 'scp-speech-target';
  constants.WAVE_1_ID                = 'scp-wave1';
  constants.WAVE_2_ID                = 'scp-wave2';
  constants.WAVE_3_ID                = 'scp-wave3';

  constants.VERT_DIVIDER_ID          = 'scp-vert-divider';
  constants.BOTTOM_ID                = 'scp-bottom-def';

  constants.CLOSE_BUTTON_ID          = 'scp-close-button';

  constants.ZOOM_VALUE_ID            = 'scp-zoom-value';
  constants.ZOOM_SLIDER_ID           = 'scp-zoom-slider-target';
  constants.ZOOM_SLIDER_BAR_ID       = 'scp-zoom-slider-bar';
  constants.ZOOM_SLIDER_THUMB_ID     = 'scp-zoom-slider-thumb';

  constants.SHOW_ID                  = 'scp-show';
  constants.PANEL_TYPES              = ['main', 'more'];

  constants.MORE_ID                  = 'scp-more';
  constants.MORE_BUTTON_GROUP_ID     = 'scp-more-button-group';
  constants.MORE_BUTTON_CONTAINER_ID = 'scp-more-button-container';

  constants.OUTLINE_ID               = 'scp-focus-outline';
  constants.MAIN_OUTLINE_ID          = 'scp-main-outline';
  constants.MAIN_OUTLINE_BORDER_ID   = 'scp-outline-def';
  constants.MORE_OUTLINE_ID          = 'scp-more-outline';

  constants.DEFAULT_BADGE_CLASS       = 'scp-default-badge';

  constants.TRANSFORMS = {
    'PANEL': {},
    'BADGE': {}
  };

  constants.TRANSFORMS.PANEL[constants.VERT_DIVIDER_ID] = {translateX:44};
  constants.TRANSFORMS.BADGE[constants.VERT_DIVIDER_ID] = {translateX:-98};

  constants.TRANSFORMS.PANEL[constants.SMALL_A_ID]      = {translateX:27};
  constants.TRANSFORMS.BADGE[constants.SMALL_A_ID]      = {translateX:0};

  constants.TRANSFORMS.PANEL[constants.LARGE_A_ID]      = {translateX:27};
  constants.TRANSFORMS.BADGE[constants.LARGE_A_ID]      = {translateX:-115};

  constants.TRANSFORMS.PANEL[constants.SPEECH_ID]       = {translateX:54};
  constants.TRANSFORMS.BADGE[constants.SPEECH_ID]       = {translateX:-100};

  constants.TRANSFORMS.PANEL[constants.ZOOM_SLIDER_THUMB_ID] = {translateX:44};
  constants.TRANSFORMS.BADGE[constants.ZOOM_SLIDER_THUMB_ID] = {translateX:14};

  constants.TRANSFORMS.PANEL[constants.ZOOM_SLIDER_BAR_ID] = {
    translateX: 27,
    scaleX    : 1,
    scaleY    : 1
  };
  constants.TRANSFORMS.BADGE[constants.ZOOM_SLIDER_BAR_ID] = {
    translateX: 19,
    scaleX    : 0.65,
    scaleY    : 1
  };

  // Elements that are only shown when panel is expanded
  // Attributes
  constants.PANEL_CONTAINER_ATTRS = {
    'ID'       : constants.BP_CONTAINER_ID,
    // First role "application" tells screen reader to go into focus (not browse) mode
    // Second role "dialog" gives more detail
    'ROLE'     : 'dialog',
    'TABINDEX' : -1,
    'CLASS'    : 'scp-loading'
  };

  constants.BADGE_ATTRS = {
    'ROLE'      : 'button',
    'TABINDEX'  : 0,
    'ARIA-LABEL': 'sitecues zoom and speech tools',
    'ARIA-BUSY' : 'false'
  };

  constants.DEFAULT_BADGE_ATTRS = {
    'ID'   : constants.BADGE_ID,
    'CLASS': constants.DEFAULT_BADGE_CLASS
  };

  // Labels
  constants.ZOOM_STATE_LABELS = {
    'ON' : 'On',
    'OFF': 'Off'
  };

  constants.SPEECH_STATE_LABELS = {
    'ON' : 'On',
    'OFF': 'Off'
  };

  // Zoom
  constants.ZOOM_KEY_INCREMENT   = 0.1;   // When arrow key pressed zoom is changed by this amount
  constants.FAKE_ZOOM_AMOUNT     = 2.2;   // If sitecues was never used, badge pretends zoom is here, to enhance attractiveness

  // Other
  constants.EXPAND_ANIMATION_DURATION_MS  = 1500;   // Time it takes to expand from badge to panel -- no hovers during this time
  constants.SHRINK_ANIMATION_DURATION_MS  = 750;  // Time it takes to shrink panel to badge -- no hovers during this time
  constants.NO_INPUT_TIMEOUT     = 7000;  // Show more button if no activity for this amount of time

  constants.FIREFOX_SLIDER_OFFSET = 83; // Hardcoded because of https://bugzilla.mozilla.org/show_bug.cgi?id=479058

  constants.FEATURES = {
    'ABOUT': {
      'EXTRA_HEIGHT'      : 150,
      'WAIT_BEFORE_EXPAND': 1600
    },
    'SETTINGS': {
      'EXTRA_HEIGHT'      : 195,
      'WAIT_BEFORE_EXPAND': 0
    },
    'FEEDBACK': {
      'EXTRA_HEIGHT'      : 195,
      'WAIT_BEFORE_EXPAND': 0
    },
    'TIPS': {
      'EXTRA_HEIGHT'      : 195,
      'WAIT_BEFORE_EXPAND': 0
    }
  };

  constants.KEY_CODES = {
    'TAB'   : 9,
    'ENTER' : 13,
    'ESCAPE': 27,
    'SPACE' : 32,
    'HOME'  : 36,
    'END'   : 35,
    'LEFT'  : 37,
    'UP'    : 38,
    'RIGHT' : 39,
    'DOWN'  : 40
  };

  // TODO compute this ratio
  // It's used to set the slider thumb properly
  constants.LARGE_SLIDER_WIDTH = 256;
  constants.SMALL_SLIDER_WIDTH = 160;

  // Minimum panel size
  constants.MINIMUM_PANEL_WIDTH = 1312;
  constants.MINIMUM_PANEL_HEIGHT = 320;

  // Amount of pixels of whitespace at the top of the badge
  // (This whitespace exists for a reason -- it turns into the top border when the panel opens)
  constants.BADGE_VERTICAL_OFFSET = 2;

  constants.BASE_STYLESHEET_ID    = 'sitecues-badge-panel-base-css';
  constants.BP_CURSOR_STYLESHEET_ID = 'sitecues-badge-panel-cursor-css';
  constants.PALETTE_STYLESHEET_ID = 'sitecues-badge-panel-palette-css';

  // Minimum size of cursor in panel
  constants.MIN_CURSOR_SIZE = 1.5;

  // Wave animation (on hover over TTS button)
  constants.ANIMATE_WAVES_OPACITY = [
    [.2,.4,.6,.8,.8,.6,.4,.2,.2,.2,.2,.4,.6,.8,.8,.6,.4,.2,.2,.2],  // Wave 1
    [.2,.2,.4,.6,.8,.8,.6,.4,.2,.2,.2,.2,.4,.6,.8,.8,.6,.4,.2,.4],  // Wave 2
    [.2,.2,.2,.4,.6,.8,.8,.6,.4,.2,.2,.2,.2,.4,.6,.8,.8,.6,.4,.6]   // Wave 3
  ];
  constants.ANIMATE_WAVES_STEP_DURATION = 100;

  constants.BADGE_MODE = 0;
  constants.PANEL_MODE = 1;

  // Unless callback() is queued, the module is not registered in global constants.modules{}
  // See: https://fecru.ai2.at/cru/EQJS-39#c187
  //      https://equinox.atlassian.net/browse/EQ-355
  callback();
});