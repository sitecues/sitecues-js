'use strict';

var SITE_ID = 's-1596260c',
  url = 'chrome-extension://' + chrome.runtime.id + '/js/sitecues.js';

window.sitecues = {
  config: {
    siteId: SITE_ID, // TODO this should be meaningless in the extension since we don't communicate with the outside
    scriptUrl: url,
    uiMode: 'toolbar',
    alwaysRealSettings: true
  },
  require: require  // Expose sitecues.require -- needed for sitecues.require call in locale.js
};

require.config({
  // Tell loader to never search for or execute a script with a "data-main"
  // attribute, since this could have weird consequences on customer pages.
  namespace: 'sitecues',
  map: {
    // Extension uses 'jquery' for $
    // because Zepto has compatibility issues with pages that use prototype.js and we dont' want to package both
    '*': {
      '$': 'jquery'
    }
  }
});

