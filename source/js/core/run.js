/*
 * Sitecues: run.js
 *   1. Initialize settings and locale
 *   2. Initialize BP
 *   3. Listen to anything that should wake up sitecues features
 *   4. Fire sitecues ready callback and page-visited metric
 */

define(['core/conf/user/manager', 'core/util/session', 'core/locale', 'core/metric', 'core/platform', 'core/bp/bp',
        'core/constants', 'core/events', 'Promise'],
  function (conf, session, locale, metric, platform, bp, CORE_CONST, events, Promise) {
  var
    areZoomEnhancementsInitialized,
    isZoomInitialized,
    isSpeechInitialized,
    isZoomOn,
    isSpeechOn,
    isSitecuesOn = false,
    isKeyReleased,
    isKeyHandlingInitialized,
    wasSitecuesEverOn,
    initialPageVisitDetails,
    // Keys that can init sitecues
    INIT_CODES = CORE_CONST.INIT_CODES,
    // Enums for sitecues loading states
    state      = CORE_CONST.READY_STATE;

  function performInitialLoadZoom(initialZoom) {
    require([ 'page/zoom/zoom' ], function (zoomMod) {
      zoomMod.init();
      zoomMod.performInitialLoadZoom(initialZoom);
    });
  }

  function initZoomEnhancingFeatures() {
    require([ 'page/hpan/hpan', 'page/zoom/fixed-position-fixer', 'page/focus/focus', 'page/cursor/cursor' ], function (hpan, fixer, focus, cursor) {
      hpan.init();
      fixer.init();
      focus.init();
      cursor.init();
    });
  }

  function initSpeech() {
    require([ 'audio/audio' ], function (audio) {
      audio.init();
    });
  }

  function initSitecuesOn() {
    require([ 'page/highlight/highlight', 'page/keys/keys', 'page/highlight/move-keys' ], function (highlight, keys, moveKeys) {
      highlight.init();
      keys.init();
      moveKeys.init();
    });
  }

  function initThemes() {
    require([ 'theme/theme', 'page/focus/focus', 'page/keys/keys' ], function (theme, focus, keys) {
      theme.init();
      focus.init();
      keys.init();
    });
  }

  function initMouse() {
    require([ 'page/cursor/cursor', 'page/keys/keys' ], function (cursor, keys) {
      cursor.init();
      keys.init();
    });
  }

  // Init features that require *either* zoom or speech to be on
  function onFeatureSettingChange() {
    var isOn = isZoomOn || isSpeechOn;
    if (isOn !== isSitecuesOn) {
      isSitecuesOn = isOn;
      events.emit('sitecues/did-toggle', isSitecuesOn);
    }
    if (isOn && !wasSitecuesEverOn) {
      initSitecuesOn();
      wasSitecuesEverOn = true;
    }
  }

  function onZoomChange(zoomLevel) {
    isZoomOn = zoomLevel > 1;
    onFeatureSettingChange();
    if (isZoomOn && !areZoomEnhancementsInitialized) {
      initZoomEnhancingFeatures();
      areZoomEnhancementsInitialized = true;
    }
  }

  function firePageVisitedMetric() {
    new metric.PageVisit(initialPageVisitDetails).send();
  }

  function onSitecuesReady() {
    firePageVisitedMetric();

    sitecues.readyState = state.COMPLETE;
    //Freeze readyState on load
    Object.defineProperty(sitecues, 'readyState', { writable : false });

    if (typeof sitecues.onReady === 'function') {
      sitecues.onReady.call(sitecues);
    }
    Object.defineProperty(sitecues, 'readyState', { writable: false }); // Do not allow reassignment, e.g. sitecues.readyState = 0;
  }

  // Initialize page feature listeners
  // This means: if a setting or event changes that requires some modules, we load and initialize the modules
  function initPageFeatureListeners() {
    // -- Zoom --
    // Previously saved values
    var initialZoom = conf.get('zoom');
    if (initialZoom > 1) {
      performInitialLoadZoom(initialZoom);
    }
    // Monitor any runtime changes
    events.on('zoom', onZoomChange);

    // -- Speech --
    conf.get('ttsOn', function(isOn) {
      isSpeechOn = isOn;
      onFeatureSettingChange();
      if (isOn && !isSpeechInitialized) {
        initSpeech();
        isSpeechInitialized = true;
      }
    });

    // -- Themes --
    if (platform.featureSupport.themes) {
      conf.get('themeName', function (themeName) {
        if (themeName) {
          initThemes();
        }
      });
    }

    // -- Mouse --
    conf.get('mouseSize', function(mouseSize) {
      if (mouseSize) {   // If undefined we use the default as set by the zoom module
        initMouse();
      }
    });
    conf.get('mouseHue', function(mouseHue) {
      if (mouseHue <= 1) {  // if undefined || > 1, mouse hue is ignored, and we keep the default mouse hue
        initMouse();
      }
    });

    // -- Keys --
    // Init keys module if sitecues was off but key is pressed that might turn it on
    if (!isKeyHandlingInitialized) {
      // Keys are not be initialized, therefore,
      // we add our lightweight keyboard listener that only
      // checks for a few keys like  +, - or alt+'
      window.addEventListener('keydown', onPossibleTriggerKeyPress);
    }
    if (!isZoomInitialized) {
      window.addEventListener('wheel', onPossibleScreenPinch);
    }

    onSitecuesReady();
  }

  function isInitializerKey(event) {
    var keyCode = event.keyCode;
    return (INIT_CODES.indexOf(keyCode) >= 0);
  }

  // Check for keys that can trigger sitecues, such as cmd+, cmd-, alt+'
  function onPossibleTriggerKeyPress(event) {
    if (isInitializerKey(event)) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        // Don't allow default behavior of modified key, e.g. native zoom
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      isKeyReleased = false;
      window.addEventListener('keyup', onKeyUp);
      require(['page/keys/keys'], function (keys) {
        keys.init(event, isKeyReleased);
      });
    }
  }

  // Ctrl + wheel events (screen pinch) can trigger sitecues
  function onPossibleScreenPinch(event) {
    if (event.ctrlKey) {
      // Don't allow default behavior of screen pinch, e.g. native zoom
      event.preventDefault();
      event.stopImmediatePropagation();
      require(['page/zoom/zoom'], function (zoomMod) {
        zoomMod.init(event);
      });
    }
  }

  function onKeyUp(event) {
    if (isInitializerKey(event)) {
      isKeyReleased = true;
    }
  }

  function onZoomInitialized() {
    isZoomInitialized = true;
    window.removeEventListener('wheel', onPossibleScreenPinch);
  }

  function onKeyHandlingInitialized() {
    isKeyHandlingInitialized = true;
    window.removeEventListener('keydown', onPossibleTriggerKeyPress);
    window.removeEventListener('keyup', onKeyUp);
  }

  function isOn() {
    return isSitecuesOn;
  }

  function initMetrics(sitecuesInitSummary) {
    // sitecuesInitSummary can contain the following fields:
    // isSameUser
    // didUseStorageBackup
    // isUnsupportedPlatform
    // error (a string)
    sitecuesInitSummary = sitecuesInitSummary || {};

    session.init({
      // Do not reuse session if user changes
      // If unsupported platform, allow session id to remain consistent
      canReuseSession: sitecuesInitSummary.isSameUser || sitecuesInitSummary.isUnsupportedPlatform
    });

    // Copy sitecuesInitSummary so we can add to it
    initialPageVisitDetails = JSON.parse(JSON.stringify(sitecuesInitSummary));

    // Add platform details
    initialPageVisitDetails.nativeZoom = platform.nativeZoom;
    initialPageVisitDetails.isRetina = platform.isRetina();
    initialPageVisitDetails.os = platform.os.is;
    initialPageVisitDetails.osVersion = platform.os.fullVersion;
    initialPageVisitDetails.browser = platform.browser.is;
    initialPageVisitDetails.browserVersion = platform.browser.version;
    if (platform.isStorageUnsupported) {
      // This occurs in Safari private browsing mode
      // Leave field undefined in the edge case
      initialPageVisitDetails.isStorageUnsupported = true;
    }

    metric.init();
  }

  function initConfAndMetrics() {
    return conf.init()
      .catch(function handlePrefsError(error) { return { error: error.message }; })
      .then(initMetrics);
  }

  function init() {
    // When keyboard listening is ready
    events.on('keys/did-init', onKeyHandlingInitialized);
    events.on('zoom/ready', onZoomInitialized);

    // Start initialization
    if (platform.init()) {
      // Supported platform: continue to init Sitecues
      Promise.all([initConfAndMetrics(), locale.init()])
        .then(bp.init)
        .then(initPageFeatureListeners);
    }
    else {
      // Unsupported platform: fail early but fire page-visited metric
      initMetrics({
        isUnsupportedPlatform: true
      });
      firePageVisitedMetric();
    }
  }

  return {
    isOn : isOn,
    init : init
  };
});
