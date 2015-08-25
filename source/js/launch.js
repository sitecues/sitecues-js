/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */

// Now
// TODO remove jquery dependency from user-id.js and others
// TODO self-initializing modules should not load most code unless necessary, including those that init from settings
// TODO defer lots of stuff until user prefs ready (initialize settings-listener?)
//      Or fire conf/did-complete?
// TODO check on server.js -- doesn't seem like the code to store data on the server actually gets used!
// TODO add to make -- jshint source/js --exclude source/js/jquery.js
// TODO use seth's more modern jshint options
// TODO Used to use these uglify options: -m -c dead_code=true    -- Which others should we use? Can we mangle property/key names now?
//      If we need to set complex options can do -o build.js e.g. http://requirejs.org/docs/optimization.html#basics
//      See all build options https://github.com/jrburke/r.js/blob/master/build/example.build.js

// Later
// TODO clean up metrics
// TODO defer page-visited and possibly other metrics until user-id.js finishes getting reply (thus cookie with user id is set)
//      user-id/did-complete
// TODO load ie9.js if necessary
// TODO move other weird ie9 code to ie9.js  -- check out has.js support in r.js
// Explore official locale stuff from requirejs
// TODO remove effects/animate from our custom build of jquery to save another 8k/3k
// TODO load custom scripts
//      source/js/custom-scripts/custom-scripts.js \
//      $(custom-files) \

define([
  'conf/user/user-id',
  'conf/user/server',
  'conf/site',
  'audio/audio',
  'audio/audio-cues',
  'zoom/zoom',
  'bp/bp',
  'keys/focus',
  'mouse-highlight/mouse-highlight',
  'cursor/cursor',
  'zoom/fixed-position-fixer',
  'hlb/hlb',
  'keys/keys',
  'mouse-highlight/move-keys',
  'hpan/hpan',
  'theme/color-engine',
  'info/info',
  'util/status'
  // 'metrics/util',
  // 'metrics/page-visited',
  // 'metrics/panel-closed',
  // 'metrics/badge-hovered',
  // 'metrics/feedback-sent',
  // 'metrics/hlb-opened',
  // 'metrics/zoom-changed',
  // 'metrics/tts-requested',
  //'metrics/metrics'
], function (
  conf_user_user_id,
  conf_user_server,
  conf_site,
  audio_audio,
  audio_audio_cues,
  zoom_zoom,
  bp,
  keys_focus,
  mh,
  cursor_cursor,
  zoom_fixed_position_fixer,
  hlb,
  keys,
  mouse_highlight_move_keys,
  hpan_hpan,
  theme_color_engine,
  info_info,
  util_status
//  metrics_util,
//  metrics_page_visited,
//  metrics_panel_closed,
//  metrics_badge_hovered,
//  metrics_feedback_sent,
//  metrics_hlb_opened,
//  metrics_zoom_changed,
//  metrics_tts_requested,
//  metrics_metrics
  ) {
  return function() {
    bp.init();
    keys.init();

  };
});

