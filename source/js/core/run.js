/*
 * Sitecues: run.js
 *   1. Initialize settings and locale
 *   2. Initialize BP
 *   3. Listen to anything that should wake up sitecues features
 *   4. Fire sitecues ready callback and metric
 */

define(['core/conf/user/manager', 'core/util/session', 'core/locale', 'core/metric', 'core/platform', 'core/bp/bp',
        'core/constants', 'core/events'],
  function (conf, session, locale, metric, platform, bp, constants, events) {
  var
    numPrereqsToComplete,
    areZoomEnhancementsInitialized,
    isZoomInitialized,
    isSpeechInitialized,
    isZoomOn,
    isSpeechOn,
    isSitecuesOn = false,
    isKeyReleased,
    isKeyHandlingInitialized,
    wasSitecuesEverOn,
    DASH     = 189,
    NUMPAD_SUBTRACT = 109,
    MINUS_ALTERNATE_1 = 173,
    MINUS_ALTERNATE_2 = 45,
    EQUALS   = 187,
    NUMPAD_ADD = 107,
    PLUS_ALTERNATE_1 = 61,
    PLUS_ALTERNATE_2 = 43,
    QUOTE = 222,
    // Keys that can init sitecues
    INIT_CODES = [ DASH, NUMPAD_SUBTRACT, MINUS_ALTERNATE_1, MINUS_ALTERNATE_2,
      EQUALS, NUMPAD_ADD, PLUS_ALTERNATE_1, PLUS_ALTERNATE_2, QUOTE],
    // Enums for sitecues loading states
    state = constants.READY_STATE;

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
    require([ 'theme/theme', 'page/focus/focus' ], function (theme, focus) {
      theme.init();
      focus.init();
    });
  }

  function initMouse() {
    require([ 'page/cursor/cursor' ], function (cursor) {
      cursor.init();
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

  function onSitecuesReady() {
    new metric.PageVisit({
      nativeZoom: platform.nativeZoom,
      isRetina  : platform.isRetina()
    }).send();

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
    conf.get('themeName', function(themeName) {
      if (themeName) {
        initThemes();
      }
    });

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

  function onPrereqComplete() {
    if (--numPrereqsToComplete === 0) {
      //Locale needs to be initialized before metric
      metric.init();
      // Both settings AND locale are now complete ... onto BP!!
      bp.init(initPageFeatureListeners);
    }
  }

  function isOn() {
    return isSitecuesOn;
  }

  function init() {
    // When keyboard listening is ready
    events.on('keys/did-init', onKeyHandlingInitialized);
    events.on('zoom/init', onZoomInitialized);

    numPrereqsToComplete = 2;

    // Start initialization
    session.init();
    platform.init();
    conf.init(onPrereqComplete);
    locale.init(onPrereqComplete);
  }

  return {
    isOn : isOn,
    init : init
  };

});
