var require = {
  // Tell loader to never search for or execute a script with a "data-main"
  // attribute, since this could have weird consequences on customer pages.
  skipDataMain : true,
  baseUrl: (function(scriptUrl) { return scriptUrl.substring(0, scriptUrl.lastIndexOf('/')) + '/'; })(sitecues.config.scriptUrl),
  // Make aliases to modules, for convenience.
  map: {
    // All modules get 'jquery-private' when they ask for 'jquery',
    // so that we can secretly return a customized value which
    // implements .noConflict() to avoid puking on customers.
    '*': {
      'jquery': 'jquery-private'
    },
    // Treat 'jquery-private' as a special case and allow it to access
    // the "real" jQuery module. Without this, there would be an
    // unresolvable cyclic dependency.
    'jquery-private': {
      'jquery': 'jquery'
    }
  },
  bundles: {
    'sitecues': [
      'core.js',
      'bp/constants.js',
      'bp/model/state.js',
      'util/platform.js',
      'bp/helper.js',
      'bp/controller/bp-controller.js',
      'locale/locale.js',
      'conf/user/manager.js',
      'conf/site.js',
      'bp/view/modes/badge.js',
      'bp/view/modes/panel.js',
      'bp/view/styles.js',
      'bp/view/svg.js',
      'bp/placement.js',
      'bp/size-animation.js',
      'bp/bp.js',
      'util/element-classifier.js',
      'keys/keys.js',
      'launch.js'
    ],
    'utils': [
      'jquery',
      'util/common',
      'util/jquery-utils'
    ],
    'bp-expanded': [
      'bp/view/elements/slider.js',
      'bp/controller/slider-controller.js',
      'bp/controller/focus-controller.js',
      'bp/controller/shrink-controller.js',
      'conf/site.js',
      'audio/speech-builder.js',
      'audio/audio.js',
      'bp/view/elements/tts-button.js',
      'util/transform.js',
      'util/animate.js',
      'bp/view/svg-transform-effects.js',
      'bp/view/elements/more-button.js',
      'bp/view/elements/secondary/tips.js',
      'bp/view/elements/secondary/settings.js',
      'bp/view/elements/secondary/feedback.js',
      'bp/view/elements/secondary/about.js',
      'bp/view/elements/secondary/secondary-panel.js'
    ]
  }
};