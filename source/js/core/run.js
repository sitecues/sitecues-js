/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */

// Different loaders? almond, define, amdlite, tinyamd, *Curl*
// For IE9 build try amdclean?
//Firefox -- BP animation slow
// IE
// - feedback page issues
// -- stars not activating via enter key in IE9
// -- Sliders ugly in IE10
// -- Performance bad in IE10 with nytimes.com
// Slow CSS in styles.js: [data-sc-reversible]
// Slow CSS in styles.js: #scp-bp-container *
// Accessibility testing
// Cross-browser testing
// TODO Localize
// TODO themes
// TODO cursor size/hue settings only -- be careful of mousehue 1.1 which means nothing
// UX testing
// Beta testing
// Applause testing
// Provisional patents  -- who can help? Jeff? Ai2?
//
// Later
//Fix unit tests
// About: Get it now
//


// Later
// Settings: why do we ever set a cookie? I don't think we can keep it between pages, at least not currently. So why save/get settings from server at all?
//           Cookie is set for metrics?


define(['core/conf/user/user-id', 'core/conf/user/server', 'core/locale', 'core/conf/user/manager', 'core/metric', 'core/platform', 'bp/bp', 'core/keys/keys' ],
  function (userId, userSettingsServer, locale, conf, metric, platform, bp, keys) {
  var
    numPrereqsToComplete,
    isZoomInitialized,
    isSpeechInitialized,
    isZoomOn,
    isSpeechOn,
    isSitecuesOn = false;

  function initZoom() {
    require([ 'hpan/hpan', 'zoom/fixed-position-fixer', 'enhance/focus', 'cursor/cursor' ], function(hpan, fixer, focus, cursor) {
      hpan.init();
      fixer.init();
      focus.init();
      cursor.init();
    });
  }

  function initSpeech() {
    require([ 'audio/audio', 'audio/text-select' ], function(audio, textSelect) {
      audio.init();
      textSelect.init();
    });
  }

  function initSitecuesOn() {
    require([ 'mouse-highlight/mouse-highlight', 'mouse-highlight/move-keys' ], function(highlight, moveKeys) {
      highlight.init();
      moveKeys.init();
    });
  }

  function initThemes() {
    require([ 'theme/color-engine' ], function(themes) {
      themes.init();
    });
  }

  function initMouse() {
    require(['cursor/cursor'], function(cursor) {
      cursor.init();
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
      initSitecuesOn();
    }
  }

  function onZoomChange(zoomLevel) {
    isZoomOn = zoomLevel > 1;
    onFeatureSettingChanged();
    if (isZoomOn && !isZoomInitialized) {
      initZoom();
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
    // Initialize other features after bp
    var initialZoom = conf.get('zoom');
    if (initialZoom) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init();
        zoomMod.performInitialLoadZoom(initialZoom);
      });
    }

    keys.init();

    firePageLoadEvent();

    sitecues.on('zoom', onZoomChange);

    conf.get('ttsOn', function(isOn) {
      isSpeechOn = isOn;
      onFeatureSettingChanged();
      if (isOn && !isSpeechInitialized) {
        initSpeech();
        isSpeechInitialized = true;
      }
    });
    conf.get('themeName', function(themeName) {
      if (themeName) {
        initThemes();
      }
    });
    conf.get('mouseSize mouseHue', function(value) {
      if (value) {
        initMouse();
      }
    });
  }

  function onPrereqComplete() {
    if (--numPrereqsToComplete === 0) {
      bp.init(onAllPrereqsComplete);
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

