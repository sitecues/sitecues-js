/**
 * Basic metrics.
 */
// jshint -W016
define(['conf/user/manager', 'conf/site', 'locale/locale', 'util/platform', 'util/xhr'],
  function(conf, site, locale, platform, xhr) {

  /**
   * *Session ID:* A random UUID v4 generated for this library session.
   * *Client time milliseconds:* The epoch time in milliseconds when the event occurred
   * *Page URL:* Full URL of the page being viewed.
   * *Site ID:* The s-XXXXXXXX site ID
   * *Zoom Level:* The current zoom level.
   * *TTS State:* enum indicating whether or not TTS is
   ** disabled : 0
   ** enabled : 1
   ** unavailable: -1
   * *Browser User Agent:* the raw user agent, to be processed by the back-end
   * *User language*: (OPTIONAL) the language the browser is set to, not the page language.
   */

  // Taken from here(free public license): https://gist.github.com/jed/982883
  var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b); };

  function send(name, data) {
    if (SC_LOCAL) {
      // Cannot save to server when we have no access to it
      // Putting this condition in allows us to paste sitecues into the console
      // and test it on sites that have a content security policy
      return;
    }

    var newData = JSON.parse(JSON.stringify(data || {})),
      siteId = site.getSiteId();
    newData.name = name;
    newData.siteId = siteId; // TODO should it be site_id ?
    newData.client_time_ms = +new Date();
    newData.zoom_level = parseFloat(conf.get('zoom')) || 1;
    newData.tts_state = + conf.get('ttsOn') || 0;
    newData.page_url = location && location.href ? location.href : '';
    // A random UUID v4 generated for this library session.
    newData.session_id = UUIDv4;
    newData.client_time_ms = +new Date();  // Epoch time in milliseconds  when the event occurred
    newData.page_url = location.href;
    newData.browser_user_agent = navigator && navigator.userAgent ? navigator.userAgent : '';
    newData.client_language = locale.getFullWebsiteLang();

    xhr.post({
      url: sitecues.getApiUrl('metrics/site/' + siteId + '/notify.json'),
      data: newData
    });
  }


  function init() {
    send('page-visited', {
      native_zoom: platform.nativeZoom,
      is_retina  : platform.isRetina()
    });
  }

  var publics = {
    init: init,
    send: send
  };

  if (SC_UNIT) {
    module.exports = publics;
  }

  return publics;
});
