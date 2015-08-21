/**
 * Basic metrics.
 */
// jshint -W016
define(['metrics/util', 'jquery', 'conf/user/manager', 'audio/audio', 'locale/locale'],
  function(metricsUtil, $, conf, audio, locale) {

  'use strict';

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

  var DEFAULT_STATE = {
      'session_id': '',
      'client_time_ms': '',
      'page_url': '',
      'zoom_level': '',
      'tts_state': '',
      'browser_user_agent': '',
      'client_language': '',
      'sc_version': sitecues.getVersion()
  };

  var metrics = this;

  // Taken from here(free public license): https://gist.github.com/jed/982883
  var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b); };

  var data;

  // TODO When is this called? For each new metric or just the first time?
  function init() {
    // Default state.
    data = $.extend({}, DEFAULT_STATE);

    // Initialization.
    var newData = {
        // A random UUID v4 generated for this library session.
        'session_id': UUIDv4(),
        // Epoch time in milliseconds  when the event occurred
        'client_time_ms': +new Date(),
        'page_url'  : location && location.href ? location.href : '',
        'zoom_level': conf.get('zoom') || 1,
        'tts_state' : +audio.isSpeechEnabled(),
        'browser_user_agent': navigator && navigator.userAgent ? navigator.userAgent : '',
        'client_language': locale.getFullWebsiteLang()
    };
    metrics.update(newData);
    sitecues.emit('metrics/ready', metrics);
  }

  // ============= Objects methods ======================
 function update(data) {
   metricsUtil.update(metrics, data, 'metrics/update');
 }

  // ============= Events Handlers ======================
  sitecues.on('zoom', function(zoomLevel) {
    var data = {'zoom_level': parseFloat(zoomLevel)};
    metrics.update(data);
  });

  sitecues.on('speech/did-change', function() {
    // + is a simple way to convert boolean to a number: true becomes 1 and false is 0.
    var data = {'tts_state': +audio.isSpeechEnabled() };
    update(data);
  });

  // Update the basic metrics when metrics event object created.
  sitecues.on('metrics/panel-closed/create metrics/badge-hovered/create metrics/hlb-opened/create metrics/zoom-changed/create metrics/feedback-sent/create',
    function() {
      var data = {'client_time_ms': +new Date()};
      update(data);
  });

  // Initialize.
  init();

  var publics = {
    update: update
  };

  if (SC_UNIT) {
    module.exports = publics;
  }

  return publics;
});
