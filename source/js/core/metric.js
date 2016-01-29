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
        exports = {
          init : init
        },
        metricConstructors = [
          TtsRequest,
          PanelFocusMove,
          PanelClick,
          PanelClose,
          SliderSettingChange,
          BadgeHover,
          PageVisit,
          LensOpen,
          KeyCommand,
          ZoomChange,
          Feedback
        ];


    function Metric(name, details) {
      this.createDataJSON(name, details);
      this.sent = false;
    }

    Metric.prototype.createDataJSON = function createDataJSON(name, details) {
      var sessionData = this.sessionData,
          data        = this.data = {
            name: name,
            clientTimeMs: Number(new Date()), // Epoch time in milliseconds  when the event occurred
            zoomLevel: conf.get('zoom') || 1,
            ttsState: conf.get('ttsOn') || false
          };

      if (details) {
        data.details = details;
      }

      Object.assign(data, sessionData);
    };

    Metric.prototype.send = function send() {

      if (SC_LOCAL || site.get('suppressMetrics')) {   // No metric events in local mode
        return;
      }

      xhr.post({
        url: urls.getApiUrl('metrics/site/' + this.data.siteId + '/notify.json?name=' + this.data.name),
        data: this.data
      });

      this.sent = true;

    };

    function TtsRequest(details) {
      Metric.call(this, name.TTS_REQUEST, details);
    }

    function PanelFocusMove(details) {
      Metric.call(this, name.PANEL_FOCUS_MOVE, details);
    }

    function PanelClick(details) {
      Metric.call(this, name.PANEL_CLICK, details);
    }

    function PanelClose(details) {
      Metric.call(this, name.PANEL_CLOSE, details);
    }

    function SliderSettingChange(details) {
      Metric.call(this, name.SLIDER_SETTING_CHANGE, details);
    }

    function BadgeHover(details) {
      Metric.call(this, name.BADGE_HOVER, details);
    }

    function PageVisit(details) {
      Metric.call(this, name.PAGE_VISIT, details);
    }

    function Feedback(details) {
      Metric.call(this, name.FEEDBACK, details);
    }

    function LensOpen(details) {
      Metric.call(this, name.LENS_OPEN, details);
    }

    function KeyCommand(details) {
      Metric.call(this, name.KEY_COMMAND, details);
    }

    function ZoomChange(details) {
      Metric.call(this, name.ZOOM_CHANGE, details);
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

      for (var i = 0; i < metricConstructors.length; i++) {
        metricConstructors[i].prototype = Object.create(Metric.prototype);
        metricConstructors[i].prototype.constructor = metricConstructors[i];
      }

    }

    metricConstructors.forEach(function (constructor) {
      exports[constructor.name] = constructor;
    });

    return exports;
  }
);
