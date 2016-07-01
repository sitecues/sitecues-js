/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/session', 'core/conf/site', 'core/locale', 'core/util/xhr',
        'core/conf/urls', 'core/constants', 'core/bp/model/classic-mode', 'core/platform' ],
  function (conf, session, site, locale, xhr, urls, constants, classicMode, platform) {

    // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
    // IMPORTANT! Have the backend team review all metrics changes!!!
    var METRICS_VERSION = 17,
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
          data[propName] = JSON.stringify(data[propName]);
        }
      }

      Object.keys(data).forEach(flattenDataField);
    }

    Metric.prototype.createDataJSON = function createDataJSON(name, details) {
      if (doLogMetrics) {
        console.log('Metric / %s', name + (details ? ' / ' + JSON.stringify(details) : ''));
      }

      function shallowCopyInto(source, dest) {
        if (source) {
          for (var keyName in source) {
            if (source.hasOwnProperty(keyName)) {
              dest[keyName] = source[keyName];
            }
          }
        }
      }

      var data = this.data = {};

      // Session data
      shallowCopyInto(sessionData, data);

      // Common fields
      data.name = name;
      data.clientTimeMs = Number(new Date()); // Epoch time in milliseconds  when the event occurred
      data.zoomLevel = conf.get('zoom') || 1;
      data.ttsState = conf.get('ttsOn') || false;

      // Platform data -- goes into details field for historical reason
      details = details || {};
      shallowCopyInto(platformData, details);

      // Ensure data we send has simple types
      flattenData(data);
      flattenData(details);

      // Log errors -- check for field name collisions and type errors in details
      if (SC_DEV) {
        logNameCollisions(name, data, details);
      }

      data.details = details;
    };

    Metric.prototype.send = function send() {
      if (SC_LOCAL || doSuppressMetrics) {   // No metric events in local mode
        return;
      }

      xhr.post({
        url: urls.getApiUrl('metrics/site/' + this.data.siteId + '/notify.json?name=' + this.data.name),
        data: this.data
      });

      metricHistory.push(this);

    };

    function getMetricHistory(){
      return metricHistory;
    }

    function wrap(metricName) {
      function metricFn(details) {
        Metric.call(this, metricName, details);
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
        isUnsupportedPlatform: platform.isUnsupportedPlatform ? true : undefined  // Don't export field when supported
      };
    }

    sitecues.toggleLogMetrics = function toggleLogMetrics() {
      doLogMetrics = !doLogMetrics;
      return doLogMetrics;
    };

    return {
      init: init,
      getMetricHistory: getMetricHistory,
      BadgeHover: wrap(name.BADGE_HOVER),
      Error: wrap(name.ERROR),
      Feedback: wrap(name.FEEDBACK),
      KeyCommand: wrap(name.KEY_COMMAND),
      LensOpen: wrap(name.LENS_OPEN),
      PageVisit: wrap(name.PAGE_VISIT),
      PanelClick: wrap(name.PANEL_CLICK),
      PanelClose: wrap(name.PANEL_CLOSE),
      PanelFocusMove: wrap(name.PANEL_FOCUS_MOVE),
      SliderSettingChange: wrap(name.SLIDER_SETTING_CHANGE),
      TtsRequest: wrap(name.TTS_REQUEST),
      ZoomChange: wrap(name.ZOOM_CHANGE)
    };
  });

