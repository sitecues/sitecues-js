/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/session', 'core/conf/site', 'core/locale', 'core/platform', 'core/util/xhr',
        'core/conf/urls', 'core/constants'],
  function (conf, session, site, locale, platform, xhr, urls, constants) {

    // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
    // IMPORTANT! Have the backend team review all metrics changes!!!
    var METRICS_VERSION = 5,
        isInitialized,
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
    };

    Metric.prototype.send = function send() {
      if (SC_LOCAL || site.get('suppressMetrics')) {   // No metric events in local mode
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

    function init() {

      if (isInitialized) {
        return;
      }
      isInitialized = true;

      Metric.prototype.sessionData = {
        scVersion: sitecues.getVersion(),
        metricVersion: METRICS_VERSION,
        sessionId: session.sessionId,
        pageViewId: session.pageViewId,
        siteId: site.getSiteId(),
        userId: conf.getUserId(),
        pageUrl: location.href,
        browserUserAgent: navigator.userAgent,
        clientLanguage: locale.getBrowserLang()
      };
    }

    return {
      init: init,
      getMetricHistory: getMetricHistory,
      TtsRequest: wrap(name.TTS_REQUEST),
      PanelFocusMove: wrap(name.PANEL_FOCUS_MOVE),
      PanelClick: wrap(name.PANEL_CLICK),
      PanelClose: wrap(name.PANEL_CLOSE),
      SliderSettingChange: wrap(name.SLIDER_SETTING_CHANGE),
      BadgeHover: wrap(name.BADGE_HOVER),
      PageVisit: wrap(name.PAGE_VISIT),
      LensOpen: wrap(name.LENS_OPEN),
      KeyCommand: wrap(name.KEY_COMMAND),
      ZoomChange: wrap(name.ZOOM_CHANGE),
      Feedback: wrap(name.FEEDBACK)
    };
  });

