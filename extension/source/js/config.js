'use strict';

var SITE_ID = 's-1596260c',
  url = 'chrome-extension://' + chrome.runtime.id + '/js/sitecues.js';

window.sitecues = {
  config: {
    siteId: SITE_ID, // TODO this should be meaningless in the extension since we don't communicate with the outside
    appUrl: url,
    uiMode: 'toolbar',
    hasOptionsMenu: true,
    alwaysRealSettings: true
  },
  _shared: {
    nativeGlobal: window  // Make our custom jQuery happy
  }
};

