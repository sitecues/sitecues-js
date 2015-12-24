/*
 * Backup data that normally goes in customer's localStorage
 * By backing it up into a js.sitecues.com iframe, we can retrieve the user's global settings when local settings don't exist.
 */

// IMPORTANT: The extension defines this module in order to override the mechanism
define(['core/conf/urls'], function (urls) {

  var PATH = '/html/prefs.html',
    ID = 'sitecues-prefs',
    iframe,
    isLoaded;

  // If data is defined, it is a set call, otherwise we are getting data
  function postMessageToIframe(optionalData) {
    if (iframe) {
      iframe.contentWindow.postMessage(optionalData, urls.getScriptOrigin());
    }
  }

  function parseData(data) {
    if (data && typeof data === 'string' && data.charAt(0) === '{') {
      try {
        return JSON.parse(data);
      }
      catch (ex) {
        clear();
        if (SC_DEV) {
          console.log('Failed to parse backed-up prefs data');
        }
      }
    }
  }

  function load(onDataAvailableFn) {
    function onMessageReceived() {
      var data = event.data,
        parsedData;

      if (SC_DEV) {
        console.log('Backup prefs retrieved');
      }
      if (event.origin === urls.getScriptOrigin()) {
        window.removeEventListener('message', onMessageReceived);
        if (SC_DEV) {
          console.log('Retrieving backed-up prefs: ' + data);
        }
        parsedData = parseData(data);
        onDataAvailableFn(parsedData);
      }
    }

    window.addEventListener('message', onMessageReceived);
    console.log('Retrieve backup prefs');
    postMessageToIframe();
  }

  function save(data) {
    if (SC_DEV) {
      console.log('Backing up prefs: ' + data);
    }
    postMessageToIframe(data);
  }

  function clear() {
    save('{}');
  }

  // Optional callbacks
  function init(onReadyCallback) {

    if (isLoaded) {
      onReadyCallback();
      return;
    }

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', true);
      iframe.setAttribute('role', 'presentation');
      iframe.id = ID;
      iframe.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;';
      iframe.src = urls.resolveResourceUrl(PATH);
      document.documentElement.appendChild(iframe);
    }

    iframe.addEventListener('load', function () {
      isLoaded = true;
      onReadyCallback();
    });
  }

  return {
    init: init,
    load: load,
    save: save,
    clear: clear
  };
});
