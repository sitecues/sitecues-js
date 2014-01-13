// The 'help' module manages the display that shows the help. The help display is populated using external
// content obtained via the user preferences server.
sitecues.def('iframe-modal', function(iframeModal, callback, log) {
  // For now, do nothing until the toolbar is re-enabled.
  callback();

/**
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
    jq.ajax({
      type: 'GET',
      url:  IFRAME_CONTENT_ENDPOINT,
      success: function(data) {
        var helpConfig = jq.extend(true, {}, data);

        // iframe tracking
        var currIFrame = null;
        var currIFrameEvent = null;
        var iframes = {};
        (function() {
          for (urlName in helpConfig.urls) {
            if (helpConfig.urls.hasOwnProperty(urlName)) {
                iframes[urlName] = jq('<iframe>').attr({
                src:          helpConfig.urls[urlName],
                frameborder:  "0",
                marginheight: "0",
                marginwidth:  "0",
                sandbox:      "allow-forms allow-same-origin allow-scripts allow-top-navigation",
                seamless:     "seamless",
                scrolling:    "auto"
              }).css({
                //transformOrigin: 'center center'
              }).addClass('sitecues-iframe-modal').hide().prependTo('html');
            }
          }
        })();

        var dimmer = $('<div>')
          .addClass('sitecues-iframe-dimmer')
          .hide()
          .prependTo('html')
          .click(function(e) {
            e.stopPropagation();
          });

        keys.registerTarget(dimmer.get(0));

        // Create the help close button.
        var modalCloseButton = closeButton.create(function() {
          closeModal();
        });

        // Display the close button.
        var closeButtonInsetTop = 5;
        var closeButtonInsetLeft = 20;
        var positionCloseButton = function(iframe) {
          var borderWidth = parseFloat(iframe.css('borderWidth')) || 0;
          var buttonWidth = modalCloseButton.dimensions().width;
          var bb = pos.getBoundingBox(iframe);
          var left = bb.left + bb.width - borderWidth - closeButtonInsetLeft - buttonWidth;
          var top =  bb.top  + borderWidth + closeButtonInsetTop;
          modalCloseButton.position(left, top);
        };

        var displayCloseButton = function() {
          modalCloseButton.enable();
        };

        var hideCloseButton = function() {
          modalCloseButton.disable();
        };

        var positionDimmer = function(viewport) {
          dimmer.css({
            width: viewport.width,
            height: viewport.height,
            left: viewport.left,
            top: viewport.top
          });
        };

        var displayDimmer = function() {
          dimmer.show();
        };

        var hideDimmer = function() {
          dimmer.hide();
        };

        var positionIFrame = function(iframe, viewport, zoom) {
          zoom = zoom || conf.get('zoom');
          var insetViewport = pos.getViewportDimensions(IFRAME_DIALOG_INSET);
          var width = Math.min(helpConfig.width, insetViewport.width) || insetViewport.width;
          var left = (viewport.width - width) / 2;
          iframe.css({
            width: width,
            height: helpConfig.height || insetViewport.height,
            left: left,
            top: insetViewport.top
            //transform: 'scale(' + zoom + ')'
          });
        };

        var displayIFrame = function(iframe) {
          iframe.show();
        };

        var hideIFrame = function(iframe) {
          iframe.hide();
        };

        var positionElements = function(iframe, zoom) {
          zoom = zoom || conf.get('zoom');
          var viewport = pos.getViewportDimensions();
          positionIFrame(iframe, viewport, zoom);
          positionDimmer(viewport, zoom);
          positionCloseButton(iframe, zoom);
        };

        var displayElements = function(iframe, zoom) {
          zoom = zoom || conf.get('zoom');
          positionElements(iframe);
          displayDimmer();
          displayIFrame(iframe);
          // Needed as the position of the button depends on the IFrame, which must be displayed to be queried.
          positionCloseButton(iframe);
          displayCloseButton(iframe);
        };

        // Opens the requested iframe.
        var openModal = function(name) {
          var iframe = iframes[name];
          if (iframe) {
            var currIFrameEvent = {
              name: name
            };
            state = STATES.OPENING;
            sitecues.emit('iframe-modal/opening', currIFrameEvent);
            eventHandlers.disableWheelScroll();
            displayElements(iframe);
            currIFrame = iframe;
            state = STATES.OPEN;
            sitecues.emit('iframe-modal/open', currIFrameEvent);
          }
        };

        // Finalize the closing of the help display.
        var closeModal = function(keepDimmer) {
          state = STATES.CLOSING;
          sitecues.emit('iframe-modal/closing', currIFrameEvent);
          hideCloseButton();
          hideIFrame(currIFrame);
          keepDimmer || hideDimmer();
          state = STATES.CLOSED;
          eventHandlers.enableWheelScroll();
          sitecues.emit('iframe-modal/closed', currIFrameEvent);
          currIFrameEvent = null;
        };

        // Tie into the event for displaying the help.
        var onShow = function(e) {
          if (state === STATES.OPEN) {
            closeModal(true);
          }
          openModal((e && e.name) || 'help');
        };
        sitecues.on('iframe-modal/show', onShow);

        // Tie into the event for hiding the help.
        var onHide = function() {
          if (state === STATES.OPEN) {
            closeModal();
          }
        };
        sitecues.on('iframe-modal/hide', onHide);
        sitecues.on('key/esc', onHide);

        conf.get('zoom', function(value) {
          if (state === STATES.OPEN) {
            positionElements(currIFrame, value);
          }
        });

      }
    });

    callback();
  });
});
**/
});