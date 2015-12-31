/**
 * Basic metrics logger
 */
define(['core/conf/user/manager', 'core/util/uuid', 'core/conf/site', 'core/locale', 'core/platform', 'core/util/xhr', 'core/conf/urls'],
  function (conf, uuid, site, locale, platform, xhr, urls) {

    var sessionId = uuid();

    return function (name, details) {
      if (SC_LOCAL) {   // No metric events in local mode
        return;
      }
      if (!site.get('suppressMetrics')) {
        var allData = {
          name: name,
          details: details,
          clientTimeMs: +new Date(),    // Epoch time in milliseconds  when the event occurred
          zoomLevel: conf.get('zoom') || 1,
          ttsState: conf.get('ttsOn') || false,
          sessionId: sessionId,   // A random UUID v4 generated for this library session.
          pageUrl: location.href,
          browserUserAgent: navigator.userAgent,
          clientLanguage: locale.getBrowserLang()
        };

        //if (SC_DEV) { console.log('Metric: ' + JSON.stringify(allData)); }

        xhr.post({
          url: urls.getApiUrl('metrics/site/' + site.getSiteId() + '/notify.json'),
          data: allData
        });
      }
    };
  }
);
