/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/session', 'core/conf/site', 'core/locale', 'core/util/xhr',
        'core/conf/urls', 'core/constants', 'core/bp/model/classic-mode' ],
  function (conf, session, site, locale, xhr, urls, constants, classicMode) {

    // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
    // IMPORTANT! Have the backend team review all metrics changes!!!
    var METRICS_VERSION = 14,
        isInitialized,
        doSuppressMetrics,
        doLogMetrics,
        name = constants.METRIC_NAME,
        metricHistory = [];


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

      Object.keys(details).forEach(logFieldNameCollision);
    }

    // Data must be of simple types
    function logTypeErrors(metricName, data) {
      function logFieldTypeError(propName) {
        var value = data[propName],
          type = typeof value;
        if (value !== null && type !== 'boolean' && type !== 'number' && type !== 'string' && type !== 'undefined') {
          console.error('Sitecues metrics type error: in metric ' + metricName + ', the ' + propName + ' details field must be a simple type');
        }
      }

      Object.keys(data).forEach(logFieldTypeError);
    }

    Metric.prototype.createDataJSON = function createDataJSON(name, details) {
      function shallowCopyInto(source, dest) {
        if (source) {
          for (var keyName in source) {
            if (source.hasOwnProperty(keyName)) {
              dest[keyName] = source[keyName];
            }
          }
        }
      }

      var sessionData = this.sessionData,
        data = this.data = {};

      shallowCopyInto(sessionData, data);
      data.name = name;
      data.clientTimeMs = Number(new Date()); // Epoch time in milliseconds  when the event occurred
      data.zoomLevel = conf.get('zoom') || 1;
      data.ttsState = conf.get('ttsOn') || false;

      // Log errors
      if (SC_DEV) {
        // Check for type errors in session data
        logTypeErrors(name, data);
        // Check for field name collisions and type errors in details
        if (details) {
          logNameCollisions(name, data, details);
          logTypeErrors(name, details);
        }
      }

      data.details = details;
    };

    Metric.prototype.send = function send() {
      if (doLogMetrics) {
        console.log('Metric / %s\n%o', this.data.name, this.data);
      }

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

    function init() {

      if (isInitialized) {
        return;
      }
      isInitialized = true;

      doSuppressMetrics = site.get('suppressMetrics');

      Metric.prototype.sessionData = {
        scVersion: sitecues.getVersion(),
        metricVersion: METRICS_VERSION,
        sessionId: session.sessionId,
        pageViewId: session.pageViewId,
        siteId: site.getSiteId(),
        userId: conf.getUserId(),
        pageUrl: location.href,
        browserUserAgent: navigator.userAgent,
        isClassicMode: classicMode(),
        clientLanguage: locale.getBrowserLang(),
        source: getSource(),
        isTester: isTester()
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

