/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/uuid', 'core/conf/site', 'core/locale', 'core/platform', 'core/util/xhr', 'core/conf/urls'],
  function (conf, uuid, site, locale, platform, xhr, urls) {

    var pageViewId = uuid(),
      sessionId = getSessionId(),
      METRICS_VERSION = 3;

    function getSessionId() {
      var SESSION_ID_KEY = '-sc-session-id',
        id = window.sessionStorage.getItem(SESSION_ID_KEY);
      if (!id) {
        id = uuid();
        window.sessionStorage.setItem(SESSION_ID_KEY);
      }
      return id;
    }

    // IMPORTANT! Increment METRICS_VERSION this every time metrics change in any way
    // IMPORTANT! Have the backend team review all metrics changes!!!

    return function (name, details) {
      if (SC_LOCAL) {   // No metric events in local mode
        return;
      }
      if (!site.get('suppressMetrics')) {
        var allData = {
          // What (metric type)
          name: name,

          // How (version info)
          scVersion: sitecues.getVersion(),  // sitecues version
          metricsVersion: METRICS_VERSION,   // Metrics version

          // When
          clientTimeMs: +new Date(),    // Epoch time in milliseconds  when the event occurred

          // Who (details about session and user)
          sessionId: sessionId,   // A random UUID v4 for this session -- stable between page loads in the same tab
          pageViewId: pageViewId,  // A random UUID v4 for this page view
          userId: conf.getUserId(),
          zoomLevel: conf.get('zoom') || 1,
          ttsState: conf.get('ttsOn') || false,
          browserUserAgent: navigator.userAgent,
          clientLanguage: locale.getBrowserLang(),

          // Where
          pageUrl: location.href,

          // Specifics
          details: details
        };

        //if (SC_DEV) { console.log('Metric: ' + JSON.stringify(allData)); }

        // TODO see if we can avoid CORS preflight by using "simple" CORS request
        xhr.post({
          url: urls.getApiUrl('metrics/site/' + site.getSiteId() + '/notify.json'),
          data: allData
        });
      }
    };
  }
);
