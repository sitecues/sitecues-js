// The 'help' module manages the display that shows the help. The help display is populated using external
// content obtained via the user preferences server.

// TODO: Most if not all of the HLB state tracking in this module should be handled by the HLB itself,
// but best not go messing around too much with the internals of the HLB right before a release and
// with another developer trying to fix other issues in the HLB.

sitecues.def('help', function(help, callback, log) {
  // The URL of the help contents.
  var HELP_CONTENTS_ENDPOINT = '//' + sitecues.coreConfig.hosts.up + '/helpContents';

  // Initial inset of the help HLB once it is added to the page.
  var HELP_FRAME_INIT_INSET = 50;

  // Help states.
  var STATES = help.STATES = {

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
  sitecues.use('jquery', 'highlight-box', 'util/positioning', 'conf', 'load', 'util/closeButton', function(jq, hlb, pos, conf, load, closeButton) {
    jq.ajax({
      type: 'GET',
      url:  HELP_CONTENTS_ENDPOINT,
      success: function(data) {
        var helpConfig = jq.extend(true, {}, data);

        // iframe tracking
        var currIFrame = null;
        var iframes = {};

        for (urlName in helpConfig.urls) {
            iframes[urlName] = jq('<iframe>').attr({
            src:          helpConfig.urls[urlName],
            frameborder:  "0",
            marginheight: "0",
            marginwidth:  "0",
            sandbox:      "allow-forms allow-same-origin allow-scripts allow-top-navigation",
            seamless:     "seamless",
            scrolling:    "auto"
          }).addClass('sitecues-help-frame').hide().prependTo('html');
        }

        // Create the help close button.
        var helpCloseButton = closeButton.create(function() {
          closeHelp();
        });

        // Display the close button.
        var closeButtonInset = 5;
        var displayCloseButton = function(iframe) {
          var borderWidth = parseFloat(iframe.css('borderWidth')) || 0;
          var bb = pos.getBoundingBox(iframe);
          var left = bb.left  + borderWidth + closeButtonInset;
          var top =  bb.top   + borderWidth + closeButtonInset;
          helpCloseButton.enable(left, top);
        };

        var displayHelpFrame = function(iframe) {
          var viewport = pos.getViewportDimensions();
          var insetViewport = pos.getViewportDimensions(HELP_FRAME_INIT_INSET);
          var width = helpConfig.width || insetViewport.width;
          var left = (viewport.width - width) / 2;
          iframe.css({
            width: width,
            height: helpConfig.height || insetViewport.height,
            left: left,
            top: HELP_FRAME_INIT_INSET
          }).show();
          currIFrame = iframe;
        };

        // Opens the help HLB.
        var openHelp = function(name) {
          state = STATES.OPENING;
          var iframe = iframes[name];
          if (url) {
            sitecues.emit('help/opening', help);
            displayHelpFrame(iframe);
            displayCloseButton(iframe);
            state = STATES.OPEN;
            sitecues.emit('help/open');
          }
        };

        // Finalize the closing of the help display.
        var closeHelp = function() {
          state = STATES.CLOSING;
          sitecues.emit('help/closing');
          helpCloseButton.disable();
          currIFrame.hide();
          state = STATES.CLOSED;
          sitecues.emit('help/closed');
        };

        // Tie into the event for displaying the help.
        var onShow = function(e) {
          if (state === STATES.OPEN) {
            closeHelp();
          }
          openHelp((e && e.name) || 'help');
        };
        sitecues.on('help/show', onShow);

        // Tie into the event for hiding the help.
        var onHide = function() {
          if (state === STATES.OPEN) {
            closeHelp();
          }
        };
        sitecues.on('help/hide', onHide);

        callback();
      }
    });
  });
});
