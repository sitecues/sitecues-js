//jshint -W071
define([], function() {

  var constants = {};

  // TODO don't repeat this in styles.js

  constants.IS_BADGE        = 'scp-is-badge';      // BP is already badge and not animating
  constants.IS_PANEL        = 'scp-is-panel';      // BP is already panel and not animating (used to be called scp-ready)
  constants.WANT_BADGE      = 'scp-want-badge';     // BP is already badge or shrinking into one
  constants.WANT_PANEL      = 'scp-want-panel';    // BP is already panel or expanding into one

  // IDs

  constants.SMALL_A_ID               = 'scp-small-A';
  constants.LARGE_A_ID               = 'scp-large-A';

  constants.SPEECH_ID                = 'scp-speech';

  constants.MAIN_ID                  = 'scp-main';
  constants.MAIN_CONTENT_FILL_ID     = 'scp-main-content-fill';

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
  constants.BOTTOM_TEXT_ID           = 'scp-bottom-text';
  constants.BOTTOM_MOUSETARGET_ID    = 'scp-bottom-mousetarget';
  constants.BOTTOM_MORE_ID           = 'scp-bottom-secondary';

  constants.CLOSE_BUTTON_ID          = 'scp-close-button';

  constants.ZOOM_VALUE_ID            = 'scp-zoom-value';
  constants.ZOOM_SLIDER_ID           = 'scp-zoom-slider-target';
  constants.ZOOM_SLIDER_BAR_ID       = 'scp-zoom-slider-bar';
  constants.ZOOM_SLIDER_THUMB_ID     = 'scp-zoom-slider-thumb';

  constants.SHOW_ID                  = 'scp-show';

  constants.SECONDARY_ID             = 'scp-secondary';
  constants.MORE_BUTTON_GROUP_ID     = 'scp-more-button-group';
  constants.MORE_BUTTON_CONTAINER_ID = 'scp-more-button-container';

  constants.SHADOW_ID                = 'scp-shadow';
  constants.OUTLINE_ID               = 'scp-focus-outline';
  constants.MAIN_OUTLINE_ID          = 'scp-main-outline';
  constants.MAIN_OUTLINE_BORDER_ID   = 'scp-outline-def';
  constants.MORE_OUTLINE_ID          = 'scp-secondary-outline';

  constants.BUTTON_MENU_ID           = 'scp-button-menu';
  constants.TIPS_BUTTON_ID           = 'scp-tips-button';
  constants.SETTINGS_BUTTON_ID       = 'scp-settings-button';
  constants.FEEDBACK_BUTTON_ID       = 'scp-feedback-button';
  constants.ABOUT_BUTTON_ID          = 'scp-about-button';
  constants.ABOUT_ROTATE_HELPER_ID   = 'scp-about-rotate-helper';
  constants.TIPS_LABEL_ID            = 'scp-tips-label';
  constants.SETTINGS_LABEL_ID        = 'scp-settings-label';
  constants.FEEDBACK_LABEL_ID        = 'scp-feedback-label';
  constants.ABOUT_LABEL_ID           = 'scp-about-label';

  constants.ABOUT_CONTENT_ID         = 'scp-about';
  constants.ABOUT_CONTENT_IMAGE_ID   = 'scp-logo-text';

  constants.FEEDBACK_CONTENT_ID      = 'scp-feedback';
  constants.FEEDBACK_INPUT_RECT      = 'scp-feedback-input-rect';
  constants.FEEDBACK_TEXTAREA        = 'scp-feedback-textarea';
  constants.FEEDBACK_SEND_BUTTON     = 'scp-feedback-send-button'; // Looks like a button
  constants.FEEDBACK_SEND_LINK       = 'scp-feedback-send-link';  // Actual active link child with click handler
  constants.RATING                   = 'scp-rating';
  constants.RATING_STAR_CLASS        = 'scp-rating-star';

  constants.SETTINGS_CONTENT_ID      = 'scp-settings';
  constants.TIPS_CONTENT_ID          = 'scp-tips';

  constants.ARROWS_ID                = 'scp-arrows';
  constants.NEXT_ID                  = 'scp-next-card';
  constants.PREV_ID                  = 'scp-prev-card';

  constants.DEFAULT_BADGE_CLASS      = 'scp-default-badge';

  // Tips panel gadgets
  constants.DEMO_PAGE                = 'scp-demo-page';
  constants.DEMO_PAGE_CONTENTS       = 'scp-demo-page-contents';
  constants.DEMO_PARA                = 'scp-demo-para';
  constants.DEMO_MOUSE               = 'scp-demo-mouse';
  constants.DEMO_SLIDER_THUMB        = 'scp-demo-slider-thumb';
  constants.DEMO_ZOOM_PLUS           = 'scp-demo-zoom-plus';
  constants.DEMO_ZOOM_MINUS          = 'scp-demo-zoom-minus';
  constants.DEMO_LENS_SPACE          = 'scp-demo-lens-spacebar';
  constants.DEMO_SPEECH_SPACE        = 'scp-demo-speech-spacebar';

  // Settings panel gadgets
  constants.THEME_POWER_ID           = 'scp-theme-power-group';
  constants.THEME_TEXT_HUE_ID        = 'scp-theme-text-hue-group';
  constants.MOUSE_SIZE_ID            = 'scp-mouse-size';

  constants.HOVER_DELAY_BADGE = 30;
  constants.HOVER_DELAY_TOOLBAR = 150;
  constants.MOUSELEAVE_DELAY_SHRINK_BP = 2000;


  constants.TRANSFORMS = {
    'PANEL'           : {},
    'BADGE'           : {},
    'ABOUT_ENABLED'   : {},
    'SETTINGS_ENABLED': {},
    'FEEDBACK_ENABLED': {},
    'TIPS_ENABLED'    : {}
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
  constants.TRANSFORMS.BADGE[constants.ZOOM_SLIDER_THUMB_ID] = {translateX:8};
  constants.TRANSFORMS.FAKE_BADGE_TRANSLATEX = 116;

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

  constants.TRANSFORMS[constants.SECONDARY_ID]             = {translateY: -198};
  constants.TRANSFORMS[constants.MORE_BUTTON_CONTAINER_ID] = { };
  constants.TRANSFORMS[constants.TIPS_BUTTON_ID]           = {translateX: 25};
  constants.TRANSFORMS[constants.SETTINGS_BUTTON_ID]       = {translateX: 235};
  constants.TRANSFORMS[constants.FEEDBACK_BUTTON_ID]       = {translateX: 465};
  constants.TRANSFORMS[constants.ABOUT_BUTTON_ID]          = {translateX: 675};

  // Elements that are only shown when panel is expanded
  // Attributes
  constants.PANEL_CONTAINER_ATTRS = {
    'id'       : constants.BP_CONTAINER_ID,
    // First role "application" tells screen reader to go into focus (not browse) mode
    // Second role "dialog" gives more detail
    'role'     : 'dialog',
    'tabindex' : -1,
    'class'    : 'scp-loading',
    'aria-label': 'sitecues'
  };

  constants.BADGE_ATTRS = {
    'role'      : 'button',
    'tabindex'  : 0,
    'aria-busy' : 'false',
    'data-sc-reversible': 'false'
  };

  constants.DEFAULT_TOOLBAR_ATTRS = {
    'id'   : constants.BADGE_ID,
    'class': 'scp-toolbar'
  };

  // Labels
  constants.ZOOM_STATE_LABELS = {
    'ZOOM_OFF': 'zoom_off',
    'PRE_ZOOM': 'pre_zoom',
    'POST_ZOOM': 'post_zoom'
  };

  constants.SPEECH_STATE_LABELS = {
    'ON' : 'on',
    'OFF': 'off'
  };

  constants.STRINGS = {
    'BADGE_LABEL': 'badge_label'
  };

  // Zoom
  constants.ZOOM_KEY_INCREMENT   = 0.1;   // When arrow key pressed zoom is changed by this amount
  constants.FAKE_ZOOM_AMOUNT     = 2.2;   // If sitecues was never used, badge pretends zoom is here, to enhance attractiveness

  // Other
  constants.EXPAND_ANIMATION_DURATION_MS  = 1500;   // Time it takes to expand from badge to panel -- no hovers during this time
  constants.SHRINK_ANIMATION_DURATION_MS  = 750;  // Time it takes to shrink panel to badge -- no hovers during this time
  constants.NO_INPUT_TIMEOUT     = 7000;  // Show more button if no activity for this amount of time

  // TODO is this still needed? It's fixed in Firefox
  constants.FIREFOX_SLIDER_OFFSET = 69; // Hardcoded because of https://bugzilla.mozilla.org/show_bug.cgi?id=479058

  // TODO compute this ratio
  // It's used to set the slider thumb properly
  constants.LARGE_SLIDER_WIDTH = 256;
  constants.SMALL_SLIDER_WIDTH = 160;

  // Ideal panel size for correct formatting of all contents.
  // We may need to use a larger size if the badge was already large
  // In that case we will make up the extra size using transform scale, so as not to disturb the HTML formatting
  constants.IDEAL_PANEL_WIDTH = 506;
  constants.IDEAL_PANEL_HEIGHT = 148;

  // Amount toolbar space that will open badge
  constants.ACTIVE_TOOLBAR_WIDTH = 500;

  // Amount of pixels of whitespace at the top of the badge
  // (This whitespace exists for a reason -- it turns into the top border when the panel opens)
  constants.BADGE_VERTICAL_OFFSET = 2;

  // Common palettes
  constants.PALETTE_NAME_ADAPTIVE = 'adaptive';
  constants.PALETTE_NAME_NORMAL = 'normal';
  constants.PALETTE_NAME_REVERSE_BLUE = 'reverse-blue';

  // Map legal full palette names to short names, used to create a class e.g. .scp-palette-rb
  constants.PALETTE_NAME_MAP = {
    'normal': '-n',
    'adaptive': '*',
    'reverse-blue': '-rb',
    'reverse-yellow': '-ry'
  };

  // Wave animation (on hover over TTS button)
  constants.ANIMATE_WAVES_OPACITY = [
    [0.2, 0.4, 0.6, 0.8, 0.8, 0.6, 0.4, 0.2, 0.2, 0.2, 0.2, 0.4, 0.6, 0.8, 0.8, 0.6, 0.4, 0.2, 0.2, 0.2],  // Wave 1
    [0.2, 0.2, 0.4, 0.6, 0.8, 0.8, 0.6, 0.4, 0.2, 0.2, 0.2, 0.2, 0.4, 0.6, 0.8, 0.8, 0.6, 0.4, 0.2, 0.4],  // Wave 2
    [0.2, 0.2, 0.2, 0.4, 0.6, 0.8, 0.8, 0.6, 0.4, 0.2, 0.2, 0.2, 0.2, 0.4, 0.6, 0.8, 0.8, 0.6, 0.4, 0.6]   // Wave 3
  ];
  constants.ANIMATE_WAVES_STEP_DURATION = 100;

  constants.BADGE_MODE = 0;
  constants.PANEL_MODE = 1;
  constants.SECONDARY_PANEL_DISABLED = 0;
  constants.SECONDARY_PANEL_ENABLED  = 1;

  return constants;
});
