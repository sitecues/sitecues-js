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
// TODO themes
// TODO in keys need to get events for lens/mh visibility
// TODO bp.js implementation of is real settings
// TODO file bug on requirejs needing sitecues.require when variable name used
// TODO what if cursor size set but no other page features set? (E.g. zoom === 1) -- we still need to init page features esp. cursor then

define(['bp/bp', 'keys/keys' ],
  function (bp, keys) {
  var ALWAYS_ON_FEATURES = [ bp, keys ],
    ZOOM_FEATURE_NAMES = ['zoom/zoom', 'hpan/hpan', 'zoom/fixed-position-fixer', 'keys/focus', 'cursor/cursor' ],
    TTS_FEATURE_NAMES = [ 'audio/audio' ],
    ZOOM_OR_TTS_FEATURE_NAMES = [ 'mouse-highlight/mouse-highlight', 'audio/audio-cues', 'hlb/hlb', 'mouse-highlight/move-keys', 'conf/site' ],
    THEME_FEATURE_NAMES = ['theme/color-engine'],
    isZoomInitialized,
    isSpeechInitialized,
    isThemeEngineInitialized,
    isZoomOn,
    isSpeechOn,
    isSitecuesOn = false;

  var conf = { init: function() {} };

  function initFeaturesByName(featureNames) {
    featureNames.forEach(function(featureName) {
      sitecues.require(featureName, function(featureModule) {
        featureModule.init();
      });
    });
  }

  // Init features that require *either* zoom or speech to be on
  function onFeatureSettingChanged() {
    var isOn = isZoomOn || isSpeechOn;
    if (isOn !== isSitecuesOn) {
      isSitecuesOn = isOn;
      sitecues.emit('sitecues/did-toggle', isSitecuesOn);
    }
    if (isOn && !isZoomInitialized && !isSpeechInitialized) {
      initFeaturesByName(ZOOM_OR_TTS_FEATURE_NAMES);
    }
  }

  return function() {
    ALWAYS_ON_FEATURES.forEach(function(feature) { feature.init(); });

    conf.init(function() {
      conf.get('zoom', function(zoomLevel) {
        isZoomOn = zoomLevel > 1;
        onFeatureSettingChanged();
        if (isZoomOn && !isZoomInitialized) {
          initFeaturesByName(ZOOM_FEATURE_NAMES);
          isZoomInitialized = true;
        }
      });
      conf.get('tts', function(isOn) {
        isSpeechOn = isOn;
        onFeatureSettingChanged();
        if (isOn && !isSpeechInitialized) {
          initFeaturesByName(TTS_FEATURE_NAMES);
          isSpeechInitialized = true;
        }
      });
      conf.get('themeName', function(themeName) {
        if (themeName && !isThemeEngineInitialized) {
          initFeaturesByName(THEME_FEATURE_NAMES);
          isThemeEngineInitialized = true;
        }
      });
    });
  };
});

