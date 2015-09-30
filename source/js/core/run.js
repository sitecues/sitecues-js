/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */

// High priority
// - French, Spanish
// - SC-3104 -- after an hour of use no TTS?
// - SC-3120 -- sitecues TTS and Safari
// - About panel
// IE
// -- panel closing too easily after click on more button
// - Plus/minus key more unreliable than they used to be
// Firefox -- BP animation slow
// CSS improvements
// - Slow CSS in styles.js: [data-sc-reversible]
// - Slow CSS in styles.js: #scp-bp-container *
// - Comment CSS to be more readable
// Small
// - cursor size/hue settings only -- be careful of mousehue 1.1 which means nothing
// Accessibility
// UX testing
// Beta testing
// Theme testing on customer sites
// Applause testing
// Provisional patents  -- who can help? Jeff? Ai2?
//
// Later
// Fix unit tests
// About: Get it now
//


// Later
// Settings: why do we ever set a cookie? I don't think we can keep it between pages, at least not currently. So why save/get settings from server at all?
//           Cookie is set for metrics?


define(['core/conf/user/user-id', 'core/conf/user/server', 'core/locale', 'core/conf/user/manager', 'core/metric', 'core/platform', 'bp/bp'],
  function (userId, userSettingsServer, locale, conf, metric, platform, bp) {
  var
    numPrereqsToComplete,
    isZoomInitialized,
    isSpeechInitialized,
    isZoomOn,
    isSpeechOn,
    isSitecuesOn = false,
    wasSitecuesEverOn,
    EQUALS   = 187,
    NUMPAD_ADD = 107,
    PLUS_ALTERNATE_1 = 61,
    PLUS_ALTERNATE_2 = 43,
    QUOTE = 222;

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
    require([ 'mouse-highlight/mouse-highlight', 'keys/keys', 'mouse-highlight/move-keys' ], function(highlight, keys, moveKeys) {
      highlight.init();
      keys.init();
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
    if (isOn && !wasSitecuesEverOn) {
      initSitecuesOn();
      wasSitecuesEverOn = true;
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
    firePageLoadEvent();

    // Initialize other features after bp
    var initialZoom = conf.get('zoom');
    if (initialZoom > 1) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init();
        zoomMod.performInitialLoadZoom(initialZoom);
      });
    }

    // Init zoom if turned on
    sitecues.on('zoom', onZoomChange);

    // Init speech if turned on
    conf.get('ttsOn', function(isOn) {
      isSpeechOn = isOn;
      onFeatureSettingChanged();
      if (isOn && !isSpeechInitialized) {
        initSpeech();
        isSpeechInitialized = true;
      }
    });

    // Init themes if turned on
    conf.get('themeName', function(themeName) {
      if (themeName) {
        initThemes();
      }
    });

    // Init mouse settings if turned on
    conf.get('mouseSize mouseHue', function(value) {
      if (value) {
        initMouse();
      }
    });

    // Init keys module if sitecues was off but key is pressed that might turn it on
    // E.g. + or ' is pressed
    if ((initialZoom > 1) === false && !isSpeechOn) {
      window.addEventListener('keydown', function (event) {
        var keyCode = event.keyCode;
        if (keyCode === EQUALS || keyCode === NUMPAD_ADD ||
          keyCode === PLUS_ALTERNATE_1 || keyCode === PLUS_ALTERNATE_2 || keyCode === QUOTE) {
          if (event.ctrlKey || event.metaKey || event.altKey) {
            // Don't allow default behavior of modified key, e.g. native zoom
            event.preventDefault();
            event.stopImmediatePropagation();
          }
          require(['keys/keys'], function (keys) {
            keys.init(event);
          });
        }
      });
    }
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

    conf.def('zoom', parseFloat); // Will further define it if zoom is turned on, in zoom.js
    userId.init();
    locale.init();
  };
});

