/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/session', 'core/conf/site', 'core/locale', 'core/platform', 'core/util/xhr',
        'core/conf/urls', 'core/constants', 'core/bp/model/classic-mode'],
  function (conf, session, site, locale, platform, xhr, urls, constants, classicMode) {

    // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
    // IMPORTANT! Have the backend team review all metrics changes!!!
    var METRICS_VERSION = 10,
        isInitialized,
        doSuppressMetrics,
        doLogMetrics,
        name = constants.METRIC_NAME,
        metricHistory = [];


    function Metric(name, details) {
      this.createDataJSON(name, details);
      this.sent = false;
    }

    Metric.prototype.createDataJSON = function createDataJSON(name, details) {
      var data = this.data = JSON.parse(JSON.stringify(this.sessionData)); // Copy sessionData to new object
      data.name = name;
      data.clientTimeMs = Number(new Date()); // Epoch time in milliseconds  when the event occurred
      data.zoomLevel = conf.get('zoom') || 1;
      data.ttsState = conf.get('ttsOn') || false;
      data.details = details;
      if (!data.userId) {
        console.error('Sitecues metrics warning: no user ID!');
        if (SC_DEV) {
          console.trace();
        }
      }
    };

    Metric.prototype.send = function send() {
      if (doLogMetrics) {
        console.log('Metric / %s\n%o\n%o', this.data.name, this.data);
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

      if (localStorage.getItem('sitecues-is-tester')) {
        // Once a tester, always a tester
        return true;
      }

      if (site.get('isTester') || !urls.isProduction()) {
        localStorage.setItem('sitecues-is-tester', 'true'); // Remember this tester
        return true;
      }

      return false;
    }

    function getSource() {
      if (SC_EXTENSION) {
        return 'extension';
      }
      if (document.querySelector('[data-provider="sitecues-proxy"]')) {
        return 'forward-proxy';
      }
      var hostname = window.location.hostname;
      if (hostname.indexOf('proxy.') === 0 || hostname.indexOf('.sitecues.com') > 0) {
        return 'reverse-proxy';
      }
      return 'page';
    }

    function init() {

      if (isInitialized) {
        return;
      }
      isInitialized = true;

      doSuppressMetrics = site.get('suppressMetrics') || isTester();

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
        source: getSource()
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

