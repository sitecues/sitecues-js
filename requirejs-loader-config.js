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
      '$': 'jquery-private'
    },
    // Treat 'jquery-private' as a special case and allow it to access
    // the "real" jQuery module. Without this, there would be an
    // unresolvable cyclic dependency.
    'jquery-private': {
      'jquery': 'jquery'
    }
  },
  bundles: {
    'sitecues': ['bp/constants','bp/model/state','util/platform','bp/helper','bp/controller/bp-controller','locale/locale','conf/user/manager','conf/site','bp/view/modes/badge','bp/view/modes/panel','bp/view/styles','bp/view/svg','bp/placement','bp/size-animation','bp/bp','util/element-classifier','keys/commands','keys/keys','core/launch'],
    'utils': ['jquery','jquery-private', 'util/common','util/jquery-utils'],
    'bp-expanded': ['bp/view/elements/slider','bp/controller/slider-controller','bp/controller/focus-controller','bp/controller/shrink-controller','bp/view/elements/tts-button','util/transform','util/animate','bp/view/svg-transform-effects','bp/view/elements/more-button','bp/view/elements/secondary/tips','bp/view/elements/secondary/settings','bp/view/elements/secondary/feedback','bp/view/elements/secondary/about','bp/view/elements/secondary/cards','bp/view/elements/secondary/secondary-panel'],
    'page-features': ['util/transform','zoom/zoom-forms','zoom/zoom','mouse-highlight/traitcache','mouse-highlight/highlight-position','mouse-highlight/traits','mouse-highlight/judge','mouse-highlight/pick','util/color','audio/speech-builder','audio/audio','util/geo','mouse-highlight/mouse-highlight','audio/audio-cues','style-service/user-agent-css','style-service/media-queries','style-service/css-aggregator','style-service/style-service','zoom/fixed-position-fixer','mouse-highlight/move-keys','hpan/hpan','keys/focus','cursor/cursor-css','cursor/cursor'],
    'hlb': ['hlb/event-handlers','hlb/styling','hlb/safe-area','hlb/positioning','hlb/dimmer','hlb/animation','hlb/hlb'],
    'themes': ['theme/color-choices','theme/img-classifier','theme/color-engine']
  }
};