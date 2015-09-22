/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */

//Firefox -- BP animation slow
// IE
// - feedback page issues
// -- stars not activating via enter key in IE9
// -- Sliders ugly in IE
// -- Performance bad in IE10 with nytimes.com
// -- hover for > arrow in tips messed up during tips animation
// -- panel closing too easily after click on more button
// Slow CSS in styles.js: [data-sc-reversible]
// Slow CSS in styles.js: #scp-bp-container *
// Accessibility testing
// Cross-browser testing
// TODO Localize, Anton Neuber (aneuber@aisquared.com), Jarek (Jaroslaw Urbansk) [jurbanski@harpo.com.pl]
// TODO themes
// TODO cursor size/hue settings only -- be careful of mousehue 1.1 which means nothing
// UX testing
// Beta testing
// Applause testing
// Provisional patents  -- who can help? Jeff? Ai2?
// TODO reduce cyclomatic complexity to 10 or less (option in .jshintrc)
// Network perf testing:
// curl 'http://js.sitecues.com/l/s;id=s-1596260c/js/sitecues.js' -H 'Accept-Encoding: gzip, deflate, sdch' -H 'Accept-Language: en,en-US;q=0.8' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.45 Safari/537.36' -H 'Accept: */*' -H 'Referer: http://ts.dev.sitecues.com/pages/beta-release.html' -H 'Cookie: WT_FPC=id=03de260b-effd-425a-a765-2aa6974f6cd5:lv=1403532403187:ss=1403531462422; optimizelyEndUserId=oeu1426033793307r0.13574404059909284; s_lv_undefined=1426033793360; AMCV_10D31225525FF5790A490D4D%40AdobeOrg=-2017484664%7CMCMID%7C62262721649324530111324499568253467117%7CMCAAMLH-1426638593%7C7%7CMCAAMB-1426638593%7CNRX38WO0n5BH8Th-nqAG_A%7CMCAID%7C2856C1E885079CB5-60000100A000E574; utag_main=v_id:014c063cd8e8005436ef87deb5d80f078003c0700093c$_sn:1$_ss:1$_pn:1%3Bexp-session$_st:1426035594098$ses_id:1426033793256%3Bexp-session; __qca=P0-2117751363-1426034638497; umbel_browser_id=fea5542f-a235-4062-9ff3-f56ffe6bc567; optimizelySegments=%7B%221802991005%22%3A%22false%22%2C%221804580032%22%3A%22direct%22%2C%221804630110%22%3A%22none%22%2C%221811611346%22%3A%22gc%22%2C%222568330011%22%3A%22false%22%2C%222571810058%22%3A%22direct%22%2C%222577670042%22%3A%22gc%22%7D; optimizelyBuckets=%7B%7D; _ga=GA1.2.655861627.1391438275; _ai2_sc_uid=1984ccfe-ae3f-4f79-ae2b-5a28627cac63' -H 'Connection: keep-alive' -H 'Cache-Control: max-age=0' --compressed -o /dev/null -w"\n            namelookup:  %{time_namelookup}\n           pretransfer:  %{time_pretransfer}\n         starttransfer:  %{time_starttransfer}\n                   end:  %{time_total}\n\n"
// Going to Virginia instead of New York?
//
// Later
//Fix unit tests
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

