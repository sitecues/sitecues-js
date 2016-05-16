/*
 * Backup data that normally goes in customer's localStorage
 * By backing it up into a js.sitecues.com iframe, we can retrieve the user's global settings when local settings don't exist.
 */

// IMPORTANT: The extension defines this module in order to override the mechanism
define(['core/conf/urls', 'core/platform', 'core/conf/site', 'Promise'], function (urls, platform, site, Promise) {

  var PATH = 'html/prefs.html',
    ID = 'sitecues-prefs',
    iframe,
    isIframeLoaded,
    ERROR_PREFIX = 'Sitecues storage backup - ',
    IS_BACKUP_DISABLED;

  // If data is defined, it is a set call, otherwise we are getting data
  function postMessageToIframe(optionalDataToSend) {
    var scriptOrigin = urls.getScriptOrigin();

    if (!urls.isProduction()) {
      // Trying to debug uncommon iframe errors (e.g. in SC-3307):
      // Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://js.sitecues.com') does not match the recipieient window's origin ('http://www.fullerton.edu').
      console.log('Attempting to communicate with storage backup, script origin = ' + scriptOrigin);
      console.log('Prefs iframe: ' + iframe.src);
    }

    return new Promise(function(resolve, reject) {
      if (SC_DEV) {
        if (optionalDataToSend) {
          console.log('Saving data to Sitecues storage backup: %o', optionalDataToSend);
        }
        else {
          console.log('Retrieving data from Sitecues storage backup');
        }
      }

      window.addEventListener('message', onMessageReceived);

      iframe.contentWindow.postMessage(optionalDataToSend, scriptOrigin);
      var timeout = setTimeout(
        onTimeout,  // Code to run when we are fed up with waiting.
        3000        // The browser has this long to get results from the iframe
      );
      
      function onMessageReceived(event) {
        clearTimeout(timeout);
        removeMessageListener();

        var eventData = event.data,
          receivedData = eventData.rawAppData,
          error = eventData.error;

        if (error) {
          reject(new Error(ERROR_PREFIX + error));
          return;
        }

        if (event.origin !== scriptOrigin) {  // Best practice: check if message is from the expected origin
          reject(new Error(ERROR_PREFIX + 'wrong origin'));
          return;
        }

        if (SC_DEV) {
          if (optionalDataToSend) {
            console.log('Saved data to Sitecues storage backup');
          }
          else if (receivedData) {
            console.log('Received data from Sitecues storage backup: %o', receivedData);
          }
          else {
            console.log('Sitecues storage backup empty');
          }
        }

        resolve(receivedData);
      }

      function removeMessageListener() {
        window.removeEventListener('message', onMessageReceived);
      }

      function onTimeout() {
        removeMessageListener();
        reject(new Error(ERROR_PREFIX + 'timed out'));
      }
    });
  }

  function performIframeAction(optionalData) {
    if (IS_BACKUP_DISABLED) {
      return Promise.resolve();
    }

    return createIframe()
      .then(function() {
        return postMessageToIframe(optionalData);
      });
  }

  function load() {
    return performIframeAction();
  }


  function save(parsedData) {
    return performIframeAction(parsedData);
  }

  function createIframe() {
    return new Promise(function(resolve, reject) {
      var timeout;

      function onTimeout() {
        removeListeners();
        reject(new Error(ERROR_PREFIX + 'timed out'));
      }

      function removeListeners() {
        iframe.removeEventListener('error', onError);
        iframe.removeEventListener('load', onLoad);
        clearTimeout(timeout);
      }

      function onLoad() {
        isIframeLoaded = true;
        resolve();
      }

      function onError(event) {
        reject(new Error(event.error));
      }

      function addListeners() {
        timeout = setTimeout(
          onTimeout,  // Code to run when we are fed up with waiting.
          3000        // The browser has this long to get results from the iframe
        );

        iframe.addEventListener('load', onLoad);
        iframe.addEventListener('error', onError);
      }

      // Has existing iframe
      if (iframe) {
        if (isIframeLoaded) {
          resolve();
        }
        else {
          addListeners();
        }
        return;
      }

      // Create iframe
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

      addListeners();
    });
  }


  function init() {
    IS_BACKUP_DISABLED = (platform.browser.isIE && platform.browser.version <= 10) || site.get('isStorageBackupDisabled');
  }

  return {
    init: init,
    load: load,   // Returns a promise
    save: save    // Returns a promise
  };
});
