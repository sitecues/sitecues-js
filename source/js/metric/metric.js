/**
 * Basic metrics logger
 */
// jshint -W016
define(['conf/user/manager', 'conf/site', 'locale/locale', 'util/platform', 'util/xhr', 'conf/urls'],
  function(conf, site, locale, platform, xhr, urls) {

  // Taken from here(free public license): https://gist.github.com/jed/982883
  var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b); };

  return function(name, details) {
    if (!SC_LOCAL && !site.get('suppressMetrics')) {
      var allData = {
        name: name,
        details: details,
        client_time_ms: +new Date(),    // Epoch time in milliseconds  when the event occurred
        zoom_level: parseFloat(conf.get('zoom')) || 1,
        tts_state: +conf.get('ttsOn') || 0,
        session_id: UUIDv4,   // A random UUID v4 generated for this library session.
        page_url: location.href,
        browser_user_agent: navigator && navigator.userAgent ? navigator.userAgent : '',
        client_language: locale.getFullWebsiteLang()
      };

      SC_DEV && console.log('Metric: ' + JSON.stringify(allData));

      xhr.post({
        url: urls.getApiUrl('metrics/site/' + site.getSiteId() + '/notify.json'),
        data: allData
      });
    }
  };
});
