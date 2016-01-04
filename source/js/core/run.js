/*
 * Sitecues: run.js
 *   1. Initialize settings and locale
 *   2. Initialize BP
 *   3. Listen to anything that should wake up sitecues features
 *   4. Fire sitecues ready callback and metric
 */

define(['core/conf/user/manager', 'core/locale', 'core/metric', 'core/platform', 'core/bp/bp'],
  function (conf, locale, metric, platform, bp) {
  var
    numPrereqsToComplete,
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
      EQUALS, NUMPAD_ADD, PLUS_ALTERNATE_1, PLUS_ALTERNATE_2, QUOTE];

  function performInitialLoadZoom(initialZoom) {
    require(['page/zoom/zoom'], function (zoomMod) {
      zoomMod.init();
      zoomMod.performInitialLoadZoom(initialZoom);
    });
  }

  function initZoomEnhancingFeatures() {
    require([ 'page/hpan/hpan', 'page/zoom/fixed-position-fixer', 'page/focus/focus', 'page/cursor/cursor' ], function(hpan, fixer, focus, cursor) {
      hpan.init();
      fixer.init();
      focus.init();
      cursor.init();
    });
  }

  function initSpeech() {
    require([ 'audio/audio' ], function(audio) {
      audio.init();
    });
  }

  function initSitecuesOn() {
    require([ 'page/highlight/highlight', 'page/keys/keys', 'page/highlight/move-keys' ], function(highlight, keys, moveKeys) {
      highlight.init();
      keys.init();
      moveKeys.init();
    });
  }

  function initThemes() {
    require([ 'theme/theme', 'page/focus/focus' ], function(theme, focus) {
      theme.init();
      focus.init();
    });
  }

  function initMouse() {
    require(['page/cursor/cursor'], function(cursor) {
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
    if (isOn && !wasSitecuesEverOn) {
      initSitecuesOn();
      wasSitecuesEverOn = true;
    }
  }

  function onZoomChange(zoomLevel) {
    isZoomOn = zoomLevel > 1;
    onFeatureSettingChanged();
    if (isZoomOn && !isZoomInitialized) {
      initZoomEnhancingFeatures();
      isZoomInitialized = true;
    }
  }

  function onSitecuesReady() {
    metric('page-visited', {
      nativeZoom: platform.nativeZoom,
      isRetina  : platform.isRetina()
    });

    if (typeof sitecues.config.onReady === 'function') {
      sitecues.config.onReady.call(sitecues);
    }
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
    sitecues.on('zoom', onZoomChange);

    // -- Speech --
    conf.get('ttsOn', function(isOn) {
      isSpeechOn = isOn;
      onFeatureSettingChanged();
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

  function onKeyUp(event) {
    if (isInitializerKey(event)) {
      isKeyReleased = true;
    }
  }

  function onKeyHandlingInitialized() {
    isKeyHandlingInitialized = true;
    window.removeEventListener('keydown', onPossibleTriggerKeyPress);
    window.removeEventListener('keyup', onKeyUp);
  }

  function onPrereqComplete() {
    if (--numPrereqsToComplete === 0) {
      // Both settings AND locale are now complete ... onto BP!!
      bp.init(initPageFeatureListeners);
    }
  }

  return function() {

    // When keyboard listening is ready
    sitecues.on('keys/did-init', onKeyHandlingInitialized);

    numPrereqsToComplete = 2;

    // Start initialization
    conf.init(onPrereqComplete);
    locale.init(onPrereqComplete);
  };
});

