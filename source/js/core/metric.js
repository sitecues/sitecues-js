/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/uuid', 'core/conf/site', 'core/locale', 'core/platform', 'core/util/xhr', 'core/conf/urls'],
  function (conf, uuid, site, locale, platform, xhr, urls) {

    var sessionId = uuid(),
      METRICS_VERSION = 2;

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
          sessionId: sessionId,   // A random UUID v4 generated for this library session.
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
