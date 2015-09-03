/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */

// Now
// TODO clean up metrics

// Test
// TODO themes
// TODO cursor size/hue settings only -- be careful of mousehue 1.1 which means nothing

// Later
// Settings: why do we ever set a cookie? I don't think we can keep it between pages, at least not currently. So why save/get settings from server at all?
//           Cookie is set for metrics?
// TODO defer page-visited and possibly other metrics until user-id.js finishes getting reply (thus cookie with user id is set)
//      user-id/did-complete
// TODO move other weird ie9 code to ie9.js  -- check out has.js support in r.js
// Explore official locale stuff from requirejs
// TODO remove effects/animate from our custom build of jquery to save another 8k/3k
// TODO load custom scripts
//      source/js/custom-scripts/custom-scripts.js \
//      $(custom-files) \
// TODO file bug on requirejs needing sitecues.require when variable name used
// TODO use seth's more modern jshint options

define(['../conf/user/user-id', 'conf/user/server', 'locale/locale', 'conf/user/manager', 'metric/metric', 'util/platform'],
  function (userId, userSettingsServer, locale, conf, metric, platform) {
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
      SC_DEV && console.log('Initializing module: ' + featureName);
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

  function firePageLoadEvent() {
    metric('page-visited', {
      nativeZoom: platform.nativeZoom,
      isRetina  : platform.isRetina()
    });
  }

  function onAllPrereqsComplete() {
    initModulesByName(ALWAYS_ON_FEATURES);

    firePageLoadEvent();

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
