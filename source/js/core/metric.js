/**
 * Basic metrics logger
 */
// jshint -W016
define(['core/conf/user/manager', 'core/conf/site', 'core/locale', 'core/platform', 'core/util/xhr', 'core/conf/urls'],
  function (conf, site, locale, platform, xhr, urls) {

    // Taken from here (free public license): https://gist.github.com/jed/982883
    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b); };

    return function (name, details) {
      if (!SC_LOCAL && !site.get('suppressMetrics')) {
        var allData = {
          name: name,
          details: details,
          clientTimeMs: +new Date(),    // Epoch time in milliseconds  when the event occurred
          zoomLevel: conf.get('zoom') || 1,
          ttsState: conf.get('ttsOn') || false,
          sessionId: UUIDv4,   // A random UUID v4 generated for this library session.
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
