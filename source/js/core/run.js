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
// TODO file bug on requirejs needing sitecues.require when variable name used
// TODO what if cursor size set but no other page features set? (E.g. zoom === 1) -- we still need to init page features esp. cursor then
// TODO need is retina info in size-animation.js
// TODO cursor settings only -- be careful of mousehue 1.1 which means nothing

define(['../conf/user/user-id', 'conf/user/server', 'locale/locale', 'conf/user/manager'], function (userId, userSettingsServer, locale, conf) {
  var
    numPrereqsToComplete,
    ALWAYS_ON_FEATURES = [ 'bp/bp', 'keys/keys' ],
    ZOOM_ON_FEATURES = [ 'hpan/hpan', 'zoom/fixed-position-fixer', 'keys/focus', 'cursor/cursor' ],
    TTS_ON_FEATURES = [ 'audio/audio' ],
    SITECUES_ON_FEATURES = [ 'mouse-highlight/mouse-highlight', 'mouse-highlight/move-keys' ],
    THEME_ON_FEATURES = [ 'theme/color-engine' ],
    MOUSE_ON_FEATURES = ['cursor/cursor'],
    isZoomInitialized,
    isSpeechInitialized,
    isZoomOn,
    isSpeechOn,
    isSitecuesOn = false;

  function initModulesByName(featureNames) {
    featureNames.forEach(function(featureName) {
      sitecues.require([featureName], function(featureModule) {
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
      initModulesByName(SITECUES_ON_FEATURES);
    }
  }

  function onZoomChange(zoomLevel) {
    isZoomOn = zoomLevel > 1;
    onFeatureSettingChanged();
    if (isZoomOn && !isZoomInitialized) {
      initModulesByName(ZOOM_ON_FEATURES);
      isZoomInitialized = true;
    }
  }

  function onAllPrereqsComplete() {
    initModulesByName(ALWAYS_ON_FEATURES);

    var initialZoom = conf.get('zoom');
    if (initialZoom) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init();
        zoomMod.performInitialLoadZoom(initialZoom);
      });
    }

    sitecues.on('zoom', onZoomChange);

    conf.get('ttsOn', function(isOn) {
      isSpeechOn = isOn;
      onFeatureSettingChanged();
      if (isOn && !isSpeechInitialized) {
        initModulesByName(TTS_ON_FEATURES);
        isSpeechInitialized = true;
      }
    });
    conf.get('themeName', function(themeName) {
      if (themeName) {
        initModulesByName(THEME_ON_FEATURES);
      }
    });
    conf.get('mouseSize mouseHue', function(value) {
      if (value) {
        initModulesByName(MOUSE_ON_FEATURES);
      }
    });
  }

  function onPrereqComplete() {
    if (--numPrereqsToComplete === 0) {
      onAllPrereqsComplete();
    }
  }

  return function() {

    // Load and initialize the prereqs before doing anything else
    numPrereqsToComplete = 2;  // User settings (conf) and locale

    sitecues.on('user-id/did-complete', function() {
      sitecues.on('conf/did-complete', onPrereqComplete); // User setting prereq: dependent on user id completion
      userSettingsServer.init();
    });

    sitecues.on('locale/did-complete', onPrereqComplete); // Local prereq

    userId.init();
    locale.init();
  };
});

