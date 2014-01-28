// The 'help' module manages the display that shows the help. The help display is populated using external
// content obtained via the user preferences server.
sitecues.def('iframe-modal', function(iframeModal, callback, log) {
sitecues.use('jquery', function ($) {

  // The URL of the help contents.
  var IFRAME_CONTENT_ENDPOINT = '//' + sitecues.getLibraryConfig().hosts.up + '/iframeModals';

  // Initial inset of the help HLB once it is added to the page.
  var IFRAME_DIALOG_INSET = 50;

  // Help states.
  var STATES = iframeModal.STATES = {

    // The help HLB is closed.
    CLOSED: {
      id : 1,
      name : 'closed'
    },

    // The help HLB is in the process of opening.
    OPENING: {
      id : 2,
      name : 'opening'
    },

    // The help HLB is open.
    OPEN: {
      id : 4,
      name : 'open'
    },

    // The help HLB is closing.
    CLOSING: {
      id : 8,
      name : 'closing'
    }
  };

  // Initially, help are closed.
  var state = STATES.CLOSED;

  // Assemble the help contents
  sitecues.use('jquery', 'highlight-box', 'util/positioning', 'conf', 'load', 'util/close-button', 'keys', 'hlb/event-handlers',
  function(jq, hlb, pos, conf, load, closeButton, keys, eventHandlers) {
    // Iframe modals disabled until further notice.
    callback();
  });
});
});