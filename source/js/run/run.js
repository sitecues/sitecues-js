/*
 * Sitecues: run.js
 *   1. Initialize settings and locale
 *   2. Initialize BP
 *   3. Listen to anything that should wake up sitecues features
 *   4. Fire sitecues ready callback and page-visited metric
 */
define(
  [
    'run/conf/preferences',
    'run/conf/id',
    'run/conf/site',
    'run/conf/urls',
    'run/sitecues-exports',
    'run/locale',
    'run/metric/metric',
    'run/platform',
    'run/bp/bp',
    'run/constants',
    'run/events',
    'run/dom-events',
    'run/modifier-key-state',
    'run/ab-test/ab-test',
    'run/shake/shake',
    'run/inline-style/inline-style'
  ],
  /*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
  function (
    pref,
    id,
    site,
    urls,
    scExports,
    locale,
    metric,
    platform,
    bp,
    CORE_CONST,
    events,
    domEvents,
    modifierKeyState,
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
      wasDisabled = true,
      // When these are both set to false, Sitecues can initialized
      // They are set during the initialization sequence
      isDisabledForPage = true,
      isDisabledGlobally = SC_EXTENSION, // Only possible for extension
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

      createPageCssHook();
    }

    // Page can make any special badge callouts visible when data-sitecues-active="desktop"
    function createPageCssHook() {
      document.documentElement.setAttribute('data-sitecues-active', 'desktop');
    }

    // Initialize page feature listeners
    // This means: if a setting or event changes that requires some modules, we load and initialize the modules
    function initPageFeatureListeners() {
      // -- Zoom --
      // Previously saved values
      var initialZoom = pref.get('zoom');
      if (initialZoom > 1) {
        performInitialLoadZoom(initialZoom);
      }
      // Monitor any runtime changes
      events.on('zoom', onZoomChange);

      // -- Speech --
      pref.bindListener('ttsOn', function (isOn) {
        isSpeechOn = isOn;
        onFeatureSettingChange();
        if (isOn && !isSpeechInitialized) {
          initSpeech();
          isSpeechInitialized = true;
        }
      });

      // -- Themes --
      if (platform.featureSupport.themes) {
        pref.bindListener('themeName', function (themeName) {
          if (themeName) {
            initThemes();
          }
        });
      }

      // -- Mouse --
      pref.bindListener('mouseSize', function (mouseSize) {
        if (mouseSize) {   // If undefined we use the default as set by the zoom module
          initMouse();
        }
      });

      pref.bindListener('mouseHue', function (mouseHue) {
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

    function setDisabledForPage(_isDisabledForPage) {
      isDisabledForPage = Boolean(_isDisabledForPage);
      if (isDisabledForPage) {
        window.localStorage.setItem('sitecues-disabled', true);
      }
      else {
        window.localStorage.removeItem('sitecues-disabled');
      }
      if (isDisabledForPage) {
        console.log('Sitecues Everywhere has been disabled on this page. Press F8 to reenable.');
        addF8Listener();
      }
      else {
        removeF8Listener();
      }
      showOrHideSitecuesIfNecessary();
    }

    function showOrHideSitecuesIfNecessary() {
      var isNowDisabled = isDisabled();
      if (isNowDisabled !== wasDisabled) {
        if (isNowDisabled) {
          hide();
        }
        else {
          if (sitecues.readyState === state.UNINITIALIZED) {
            init(); // First time
          }
          else {
            unhide(); // Was previously initialized
          }
        }
      }
      wasDisabled = isNowDisabled;
    }

    function setDisabledGlobally(_isDisabledGlobally) {
      if (SC_EXTENSION) { // Can only be disabled globally by extension
        isDisabledGlobally = Boolean(_isDisabledGlobally);
        pref.set('isDisabledGlobally', isDisabledGlobally); // TODO will this be repeated in each window?
        if (isDisabledGlobally) {
          console.log('Sitecues has been paused globally. Use extension icon next to the browser\'s location bar to unpause.');
        }
        showOrHideSitecuesIfNecessary();
      }
    }

    // Desired behavior:
    // Extension:
    //   - if either is disabled (paused), Sitecues Everywhere will not run
    // Page script:
    //   - if page is disabled, page script will not run
    //   - if extension is disabled (paused), page script can still run if not disabled for page
    //     In that case both scripts are running, and the page script cannot even see
    //     isDisabledGlobally (will always be false in that script).
    //     Basically, the page script cannot be disabled globally.
    function isDisabled() {
      return Boolean(isDisabledForPage || isDisabledGlobally);
    }

    function checkF8(event) {
      if (event.keyCode === CORE_CONST.KEY_CODE.F8) {
        setDisabledForPage(false);
      }
    }

    function addF8Listener() {
      document.addEventListener('keydown', checkF8);
    }

    function removeF8Listener() {
      document.removeEventListener('keydown', checkF8);
    }

    function moveAwayBadge(newTop) {
      var badge = document.getElementById('sitecues-badge');
      if (badge) {
        // Animate hiding of Sitecues toolbar
        badge.style.transition = document.hasFocus() ? 'top 500ms linear' : '';
        requestAnimationFrame(function() {
          badge.style.top = newTop;
        });
      }
    }

    // Hide Sitecues
    function hide() {
      if (isSitecuesOn) {
        require(['page/reset/reset'], function(reset) {
          // Reset Sitecues settings
          reset.init();
          reset.resetAll();
        });
      }
      moveAwayBadge('-40px');
    }

    function unhide() {
      moveAwayBadge('');
    }

    function init() {
      if (SC_DEV) {
        console.log('Initializing Sitecues');
      }

      // Set sitecues state flag to initializing
      sitecues.readyState = state.INITIALIZING;

      if (SC_EXTENSION) {
        document.documentElement.setAttribute('data-sitecues-everywhere', 'on');
      }

      // When keyboard listening is ready
      events.on('keys/did-init', onKeyHandlingInitialized);
      events.on('zoom/ready', onZoomInitialized);

      // Early synchronous initialization
      site.init();         // Site configuration module
      urls.init();         // API and services URLs
      platform.init();     // Info about current platform, init now in case we need for error metric
      scExports.init(isOn);  // Sitecues exports

      id.init()
        .then(function () {
          // Synchronous initialization
          abTest.init();
          metric.init();
          inlineStyle.init();  // Inline style utility
          domEvents.init();    // Support for passive dom event listeners
        })
        .then(function () {
          return locale.init()  // TODO try to put this as part of earlier Promise.all
            .then(bp.init)
            .then(metric.initViewInfo)
            .then(initPageFeatureListeners);
        });
    }

    if (!SC_EXTENSION && document.documentElement.getAttribute('data-sitecues-everywhere') === 'on') {
      return; // Prefer extension
    }

    sitecues.readyState = state.UNINITIALIZED;
    startSitecuesLoad = getCurrentTime();

    pref.init()
      .then(function() {
        if (SC_EXTENSION) {
          window.sitecues.setDisabledGlobally = setDisabledGlobally; // Make available to other extension scripts
          setDisabledGlobally(pref.get('isDisabledGlobally'));
        }
        setDisabledForPage(window.localStorage.getItem('sitecues-disabled'));
      });

    return {
      setDisabledForPage: setDisabledForPage,
      setDisabledGlobally: setDisabledGlobally,
      isDisabled: isDisabled
    };
  });
