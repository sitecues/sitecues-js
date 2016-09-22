/*
 * Sitecues: run.js
 *   1. Initialize settings and locale
 *   2. Initialize BP
 *   3. Listen to anything that should wake up sitecues features
 *   4. Fire sitecues ready callback and page-visited metric
 */
define(
  [
    'core/conf/user/manager',
    'core/util/ids',
    'core/locale',
    'core/metric',
    'core/platform',
    'core/bp/bp',
    'core/constants',
    'core/events',
    'core/dom-events',
    'core/modifier-key-state',
    'core/native-functions',
    'core/ab-test/ab-test',
    'core/shake/shake',
    'core/inline-style/inline-style'
  ],
  /*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
  function (
    conf,
    ids,
    locale,
    metric,
    platform,
    bp,
    CORE_CONST,
    events,
    domEvents,
    modifierKeyState,
    nativeFn,
    abTest,
    shake,
    inlineStyle
  ) {
    /*jshint +W072 */
    'use strict';

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
      startSitecuesLoad,
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
      require([ 'page/hpan/hpan', 'page/positioner/positioner', 'page/focus/focus', 'page/cursor/cursor' ], function (hpan, positioner, focus, cursor) {
        hpan.init();
        positioner.initFromZoom();
        focus.init();
        cursor.init();
      });
    }

    function initSpeech() {
      require([ 'audio/audio', 'page/page'  ], function (page, audio) {
        page.init();
        audio.init();
      });
    }

    function initSitecuesOn() {
      require([ 'page/page', 'page/highlight/highlight', 'page/keys/keys', 'page/highlight/move-keys'], function (page, highlight, keys, moveKeys) {
        page.init();
        highlight.init();
        keys.init();
        moveKeys.init();
      });
    }

    function initThemes() {
      require([ 'page/page', 'theme/theme', 'page/focus/focus', 'page/keys/keys' ], function (page, theme, focus, keys) {
        page.init();
        theme.init();
        focus.init();
        keys.init();
      });
    }

    function initMouse() {
      require([ 'page/page', 'page/cursor/cursor', 'page/keys/keys' ], function (page, cursor, keys) {
        page.init();
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
      var
        initDetails = {
          startSitecuesLoad: startSitecuesLoad,
          startSitecuesInteractive: getCurrentTime(),
          // TODO These should be moved into the page-visited metric that moved to the minicore
          // startPageLoad: performance.timing.responseEnd - fetchStartTime,
          // startPageInteractive: performance.timing.domInteractive - fetchStartTime,
          nativeZoom: platform.nativeZoom,
          isRetina: platform.isRetina(),
          isStorageUnsupported: platform.isStorageUnsupported   // E.g. Safari private browsing
        };

      new metric.SitecuesReady(initDetails).send();
    }

    function getCurrentTime() {
      return Math.floor(performance.now());
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

      modifierKeyState.init();

      shake.init();

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
          // TODO IE11: TypeError: Unable to get property 'init' of undefined or null reference
          // {"eventId":"10e771ce-97a8-4d53-985a-c4912485032a","serverTs":1463756071982,"clientIp":"10.235.39.83","siteKey":"s-0000ee0c","isTest":false,"userId":null,"clientData":{"scVersion":"4.0.73-RELEASE","metricVersion":12,"sessionId":"5fd5d275-5204-4e45-af83-c134e3c7bce8","pageViewId":"ceb79818-a1bf-47ec-8b3e-6b3419796adc","siteId":"s-0000ee0c","userId":"6f90e948-9980-4e19-87e0-9ec50958db05","pageUrl":"https://www.eeoc.gov/eeoc/publications/ada-leave.cfm","browserUserAgent":"Mozilla/5.0 (Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET CLR 1.1.4322; InfoPath.3; .NET4.0C; .NET4.0E; Tablet PC 2.0; rv:11.0) like Gecko","isClassicMode":false,"clientLanguage":"en-US","source":"page","isTester":false,"name":"error","clientTimeMs":1463756071497,"zoomLevel":1,"ttsState":false,"details":{"message":"Unable to get property 'init' of undefined or null reference","stack":"TypeError: Unable to get property 'init' of undefined or null reference\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:128:442)\n   at W (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:8:256)\n   at O (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:9:31)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:10:28)\n   at k (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:20:460)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:21:72)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:19:226)\n   at Anonymous function (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:19:204)\n   at a (https://js.sitecues.com/l/s;id=s-0000ee0c/js/sitecues.js:19:94)"}}}
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

    function init() {
      startSitecuesLoad = getCurrentTime();

      // When keyboard listening is ready
      events.on('keys/did-init', onKeyHandlingInitialized);
      events.on('zoom/ready', onZoomInitialized);

      // Synchronous initialization
      ids.init();
      inlineStyle.init();
      platform.init();
      nativeFn.init();
      domEvents.init();
      abTest.init();
      metric.init();

      // Async initialization
      locale.init()
        .then(bp.init)
        .then(metric.initViewInfo)
        .then(initPageFeatureListeners);
    }

    return {
      isOn : isOn,
      init : init
    };
  });