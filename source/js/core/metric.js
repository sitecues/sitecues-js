/**
 * Basic metrics logger
 */
define(
  [
    'core/conf/user/manager',
    'core/util/session',
    'core/conf/site',
    'core/locale',
    'core/util/xhr',
    'core/conf/urls',
    'core/constants',
    'core/bp/model/classic-mode',
    'core/platform',
    'core/native-functions'
  ],
  function (
    conf,
    session,
    site,
    locale,
    xhr,
    urls,
    constants,
    classicMode,
    platform,
    nativeFn
  ) {
  'use strict';

    // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
    // IMPORTANT! Have the backend team review all metrics changes!!!
    var METRICS_VERSION = 18,
        isInitialized,
        doSuppressMetrics,
        doLogMetrics,
        name = constants.METRIC_NAME,
        metricHistory = [],
        platformData,
        sessionData;


    function Metric(name, details) {
      this.createDataJSON(name, details);
      this.sent = false;
    }

    function logNameCollisions(metricName, data, details) {
      // In dev, log field name collisions because the backend is going to flatten the metrics object
      function logFieldNameCollision(propName) {
        if (data.hasOwnProperty(propName)) {
          console.error('Sitecues error: name collision for metric ' + metricName + ' field name ' + propName);
        }
      }

      if (details) {
        Object.keys(details).forEach(logFieldNameCollision);
      }
    }

    // Data must be of simple types
    function flattenData(data) {
      function flattenDataField(propName) {
        var value = data[propName],
          type = typeof value;
        if (value !== null && type !== 'boolean' && type !== 'number' && type !== 'string' && type !== 'undefined') {
          data[propName] = nativeFn.JSON.stringify(data[propName]);
        }
      }

      Object.keys(data).forEach(flattenDataField);
    }

    // TODO: Delete this and use Object.assign() when we drop IE support.
    function assign(target, source) {
      if (source) {
        Object.keys(source).forEach(function (key) {
          target[key] = source[key];
        });
      }
    }

    Metric.prototype.createDataJSON = function createDataJSON(name, details) {
      if (doLogMetrics) {
        console.log('Metric / %s', name + (details ? ' / ' + nativeFn.JSON.stringify(details) : ''));
      }

      var data = this.data = {},
        settings = getSettings(); // Gets all prefs

      // Session data
      assign(data, sessionData);

      // Common fields
      data.name = name;
      data.clientTimeMs = Number(new Date()); // Epoch time in milliseconds  when the event occurred
      data.zoomLevel = conf.get('zoom') || 1;
      data.ttsState = conf.get('ttsOn') || false;

      // Platform data -- goes into details field for historical reason
      details = details || {};
      assign(details, platformData);

      // Ensure data we send has simple types
      flattenData(data);
      flattenData(details);
      flattenData(settings);  // Should already be flat, but we're being extra careful about superfluous fields

      // Log errors -- check for field name collisions and type errors in details
      if (SC_DEV) {
        logNameCollisions(name, data, details);
      }

      data.details = details;
      data.settings = settings;
    };

    Metric.prototype.send = function send() {
      /*jshint validthis: true */
      if (SC_LOCAL || doSuppressMetrics) {   // No metric events in local mode
        return;
      }

      xhr.post({
        url: urls.getApiUrl('metrics/site/' + this.data.siteId + '/notify.json?name=' + this.data.name),
        data: this.data
      });

      metricHistory.push(this);
      /*jshint validthis: false */
    };

    function getMetricHistory(){
      return metricHistory;
    }

    function wrap(metricName) {
      function metricFn(details) {
        /*jshint validthis: true */
        Metric.call(this, metricName, details);
        /*jshint validthis: false */
      }
      metricFn.prototype = Object.create(Metric.prototype);
      metricFn.prototype.constructor = metricFn;
      return metricFn;
    }

    function isTester() {

      if (conf.get('isTester')) {
        // Once a tester, always a tester
        return true;
      }

      if (site.get('isTester') || !urls.isProduction()) {
        conf.set('isTester', true);  // Remember this tester
        return true;
      }

      return false;
    }

    // TODO Should go away once we go to the new extension which is entirely in a content script
    function isOldExtension() {
      return sitecues.everywhereConfig;
    }

    // Return settings we care about
    function getSettings() {
      var settings = conf.get(),
        BLACKLIST = {
          'firstHighZoom': 1, // Not interesting
          'firstSpeechOn': 1, // Not interesting
          'isTester': 1,  // Redundant with field on main object
          'ttsOn': 1,  // Redundant with field on main object
          'zoom': 1  // Redundant with field on main object
        },
        reducedSettings = {};

      Object.keys(settings).forEach(function(settingName){
        if (!BLACKLIST[settingName]) {
          reducedSettings[settingName] = settings[settingName];
        }
      });
      return reducedSettings;
    }

    function getSource() {
      if (SC_EXTENSION || isOldExtension()) {
        return 'extension';
      }
      var hostname = window.location.hostname;
      if (hostname.indexOf('proxy.') === 0 && hostname.indexOf('.sitecues.com') > 0) {
        return 'reverse-proxy';
      }
      if (document.querySelector('script[data-provider="sitecues-proxy"]')) {
        return 'forward-proxy';
      }
      return 'page';
    }

    function getPageUrl(source) {
      if (source === 'reverse-proxy') {
        // We want the viewed page's target url, not the url for the proxy itself
        var targetUrl = location.pathname + location.search + location.hash;
        // TODO: Remove page/ replacement once the proxy stops using this route prefix in Fall 2016. We'll still need to remove the extra / at the start.
        targetUrl = targetUrl.replace(/^\/(?:page\/)?/, '');
        targetUrl = decodeURIComponent(targetUrl);  // In case target url was escaped
        return targetUrl;
      }

      return location.href;
    }

    // This info is not available right away -- we add to session data as soon as available
    function initViewInfo(viewInfo) {
      assign(sessionData, viewInfo);
    }

    function init() {

      if (isInitialized) {
        return;
      }
      isInitialized = true;

      doSuppressMetrics = site.get('suppressMetrics');

      var source = getSource();

      sessionData = {
        scVersion: sitecues.getVersion(),
        metricVersion: METRICS_VERSION,
        sessionId: session.sessionId,
        pageViewId: session.pageViewId,
        siteId: site.getSiteId(),
        userId: conf.getUserId(),
        pageUrl: getPageUrl(source),
        browserUserAgent: navigator.userAgent,
        isClassicMode: classicMode(),
        clientLanguage: locale.getBrowserLang(),
        source: source,
        isTester: isTester()
      };

      platform.init();
      platformData = {
        os: platform.os.is,
        osVersion: platform.os.fullVersion,
        browser: platform.browser.is,
        browserVersion: platform.browser.version,
        navPlatform: navigator.platform, // For debugging -- we no longer use it to determine OS
        isUnsupportedPlatform: platform.isUnsupportedPlatform ? true : undefined  // Don't export field when supported
      };
    }

    sitecues.toggleLogMetrics = function toggleLogMetrics() {
      doLogMetrics = !doLogMetrics;
      return doLogMetrics;
    };

    return {
      init: init,
      initViewInfo: initViewInfo,
      getMetricHistory: getMetricHistory,
      BadgeHover: wrap(name.BADGE_HOVER),
      Error: wrap(name.ERROR),
      Feedback: wrap(name.FEEDBACK),
      KeyCommand: wrap(name.KEY_COMMAND),
      LensOpen: wrap(name.LENS_OPEN),
      MouseShake: wrap(name.MOUSE_SHAKE),
      PageVisit: wrap(name.PAGE_VISIT),
      PanelClick: wrap(name.PANEL_CLICK),
      PanelClose: wrap(name.PANEL_CLOSE),
      PanelFocusMove: wrap(name.PANEL_FOCUS_MOVE),
      SliderSettingChange: wrap(name.SLIDER_SETTING_CHANGE),
      TtsRequest: wrap(name.TTS_REQUEST),
      ZoomChange: wrap(name.ZOOM_CHANGE)
    };
  });

