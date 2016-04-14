/*
 * Backup data that normally goes in customer's localStorage
 * By backing it up into a js.sitecues.com iframe, we can retrieve the user's global settings when local settings don't exist.
 */

// IMPORTANT: The extension defines this module in order to override the mechanism
define(['core/conf/urls', 'core/platform'], function (urls, platform) {

  var PATH = 'html/prefs.html',
    ID = 'sitecues-prefs',
    iframe,
    isLoaded,
    isInitialized,
    IS_BACKUP_DISABLED;

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
    function onMessageReceived(event) {
      var key,
        isEmpty = true,
        data = event.data,
        parsedData = {};

      if (event.origin === urls.getScriptOrigin()) {  // Best practice: check if message is from the expected origin
        if (SC_DEV) {
          console.log('Backup prefs retrieved');
        }

        parsedData = parseData(data);

        // Check if parsed back-up storage has saved preferences or a site ID
        /*jshint forin: false */
        for (key in parsedData) {
          isEmpty = false;
        }
        /*jshint forin: true */
      }

      window.removeEventListener('message', onMessageReceived);

      if (isEmpty) {
        onDataAvailableFn(); // Use callback even if we don't use the data -- otherwise sitecues won't load
      }
      else {
        onDataAvailableFn(parsedData);
      }
    }

    if (IS_BACKUP_DISABLED) {
      onDataAvailableFn();
      return;
    }
    window.addEventListener('message', onMessageReceived);
    if (SC_DEV) {
      console.log('Retrieve backup prefs');
    }
    postMessageToIframe();
  }

  function save(data) {
    init(function () {
      if (IS_BACKUP_DISABLED) {
        return;
      }
      if (SC_DEV) {
        console.log('Backing up prefs: ' + data);
      }
      postMessageToIframe(data);
    });
  }

  function clear() {
    save('{}');
  }

  // Optional callbacks
  function init(onReadyCallback) {

    IS_BACKUP_DISABLED = platform.browser.isIE && platform.browser.version <= 10;

    if (isInitialized || isLoaded || IS_BACKUP_DISABLED) {
      onReadyCallback();
      return;
    }
    isInitialized = true;

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', true);
      iframe.setAttribute('role', 'presentation');
      iframe.id = ID;
      // Needs to have some size (1x1) and not be display:none -- otherwise it won't load in some browsers
      iframe.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;visibility:hidden;';
      iframe.src = urls.resolveResourceUrl(PATH);
      // Set title and text description for iframe. Without this, accessibility tools fail,
      // even though they shouldn't given that it has aria-hidden="true" and says role="presentation".
      // But, customers rightly insist that we pass their tools.
      // The real point is that screen reader users either won't see the iframe, or if they do, it won't be a complete mystery.
      // We used a text phrase that does not need to be localized, just to save effort ... the word 'data' is pretty international.
      var SITECUES_IFRAME_TEXT = 'Sitecues data';
      iframe.setAttribute('title', SITECUES_IFRAME_TEXT);
      iframe.innerText = SITECUES_IFRAME_TEXT;
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
    save: save
  };
});
