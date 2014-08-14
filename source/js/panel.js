sitecues.def( 'panel', function (panel, callback) {
  'use strict';

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use( 'jquery', 'audio', 'slider', 'ui', 'html-build',
    function( $, audio, SliderClass, ui, htmlBuild) {

    var PANEL_WIDTH = 500;
    var PANEL_HEIGHT = 80;  // To keep aspect ratio, HEIGHT is WIDTH * .16

    panel.hideDelay = 1500;
    // Forcing a change to merge from Thom into master
    // to make sure that I'm actually getting the real code.
    //log.info('!!! TEMP !!! panel.hideDelay');

    // This is the parent element of the panel.  The default setup does
    // not need one, this is only when we're using a custom target via
    // badgeId or panelDisplaySelector properties.
    panel.parent = null;

    // Use to check whether a panel element already exists. If it does, then there
    // is no need to call create() again, but instead just show();
    panel.created = false;

    // The panel element
    panel.element = undefined;

    // The panel placer element (currently only used with the default badge).
    panel.placer = undefined;

    // Sticky param for panel
    panel.isSticky = false;

    // Whether opening to the left or right
    panel.useLeft = false;

    // Badge rect when panel opens
    panel.badgeRect = {};

      // Helper function to make panel sticky
    sitecues.toggleStickyPanel = function () {
      if (panel.isSticky===false) {
        panel.isSticky = true;
        return true;
      } else {
        panel.isSticky = false;
        return false;
      }
    };

    // Create panel element.
    function create() {

      // private variables
      var frame, ttsButton;

      // create element and add element id for proper styling
      frame = htmlBuild.$div()
        .attr('id','sitecues-panel')
        .css({
          display: 'none',
          width: PANEL_WIDTH + 'px',
          height: PANEL_HEIGHT + 'px'
        });
    
      // Create a Slider Instance for the Panel
      panel.slider = {};
      panel.slider.wrap = $('<div id="sitecues-slider-wrap">').appendTo(frame);
      panel.slider.widget = SliderClass.build({
        width: 340,
        height:80,
        container: panel.slider.wrap,
        color: {
          letterSmlBack     : { normal: 'rgba(0,0,0,0)', hover: 'rgba(0,0,0,0)'},
          trackBack         : { normal: 'rgba(0,0,0,0)', hover: 'rgba(0,0,0,0)'},
          letterBigBack     : { normal: 'rgba(0,0,0,0)', hover: 'rgba(0,0,0,0)'},
          letterSml         : { normal: '#000000', hover: '#000000'},
          track             : { normal: '#000000', hover: '#000000'},
          thumb             : { normal: '#3265c1', hover: '#3265c1'},
          letterBig         : { normal: '#000000', hover: '#000000'}
        }
      });

      // create TTS button and set it up
      ttsButton = $('<div id="sitecues-tts" class="sitecues-clickable">').appendTo(frame);
      
      if ( audio.isSpeechEnabled()) {
        ttsButton.data( 'tts-enable', 'enabled' );
      } else {
        ttsButton.addClass( 'tts-disabled' );
        ttsButton.data( 'tts-enable', 'disabled' );
      }
      ttsButton.click(function() {
        sitecues.emit('panel/interaction');
        ttsToggle();
      });

      if (panel.parent) {
        panel.parent.click(function(e) {
          e.preventDefault();
          return false;
        });
      }

      frame.appendTo('html');

      // Set panel to 'created'
      panel.created = true;

      panel.element = frame;
      
      // return panel
      return frame;
    }

    // Show panel.
    function show() {

      panel.element.hide();

      if (!panel.parent) {
        return; // Nothing to go on
      }

      function setSliderDimensions() {
        // Set/recheck the dimensions of the slider
        var sliderWidget = panel.slider.widget;
        sliderWidget.setdimensions(sliderWidget);
        sliderWidget.setThumbPositionFromZoomLevel.call(sliderWidget, sliderWidget.zoomLevel);
        sliderWidget.translateThumbSVG.call(sliderWidget);
      }

      panel.element.animate({
          width   : 'toggle',
          height  : 'toggle',
          opacity : 1.0
        },
        750,
        function() {
          sitecues.emit('panel/show', panel.element);
          setSliderDimensions();
        }
      );

      panel.badgeRect = $('#sitecues-badge').get(0).getBoundingClientRect();
      // Would panel go off the right side of screen? If YES -> open to the left
      panel.useLeft = panel.badgeRect.left + PANEL_WIDTH + 15 < window.innerWidth;

      refreshPanel();
      setSliderDimensions();

      panel.element.hover(function() {
        // Hover in.
        panel.element.data('hover','true');
      }, function() {
        // Hover out.
        panel.element.data('hover','false');
      });

      $(window).scroll(hide);
    }

    // Hide panel.
    function hide() {
      if(panel.element.data('hover') === 'true' || panel.element.data('badge-hover') === 'true') {
        // We're hovering over the element, delay hiding it.
        setTimeout(hide, panel.hideDelay);
        return;
      }

      if (panel.isSticky === false) {
        // Hide panel.
        panel.element
        .css('display', 'none')
        .effects({
          opacity : 0
        },
        'fast',
        null,
        function(){
          // Notify about panel hiding.
          sitecues.emit('panel/hide', panel.element);
        });

        $(window).off('scroll');
      }
    }

    // Function that will toggle tts on or off.
    function ttsToggle() {
      var ttsButton = $('#sitecues-tts');
      if(ttsButton.data('tts-enable') === 'disabled') {
        // It's disabled, so enable it
        audio.setSpeechState(true);
        showTTSbuttonEnabled(ttsButton);
      } else {
        // It's enabled (or unknown), so disable it
        audio.setSpeechState(false);
        showTTSbuttonDisabled(ttsButton);
      }
    }

    // Show TTS is enabled.
    function showTTSbuttonEnabled(ttsButton) {
      ttsButton = ttsButton || $('#sitecues-tts');
      ttsButton.data('tts-enable','enabled');
      ttsButton.removeClass('tts-disabled');
    }

    // Show TTS is disabled.
    function showTTSbuttonDisabled (ttsButton) {
      ttsButton = ttsButton || $('#sitecues-tts');
      ttsButton.data('tts-enable','disabled');
      ttsButton.addClass('tts-disabled');
    }

    function refreshPanel() {
      var badge = $('#sitecues-badge'),
          left,
          top = panel.badgeRect.top + parseFloat(badge.css('padding-top'));

      if (!panel.parent) {
        return;
      }

      if (!panel.useLeft) {
        panel.element.css({left: '', right: 0 });
        left = -window.innerWidth + panel.badgeRect.right;
      }
      else {
        panel.element.css({left: 0, right: ''});
        left = panel.badgeRect.left;
      }

      if (!platform.browser.isIE) {
        // Don't include page offsets in IE, otherwise the panel opens from the wrong place when panning
        left += window.pageXOffset;
        top += window.pageYOffset;
      }

      panel.element.css({
        transformOrigin: panel.useLeft ? '0% 0%' : '100% 0%',
        transform: 'translate(' + left + 'px, ' + top + 'px)'
      });

    }


    // EVENT HANDLERS

    // Setup trigger to show panel.
    sitecues.on('badge/hover', function() {
      show();
      panel.element.data('badge-hover','true');
    });

    // Setup trigger to show panel.
    sitecues.on('badge/leave', function() {
      panel.element.data('badge-hover','false');
      setTimeout(hide, panel.hideDelay);
    });

    sitecues.on('speech/enabled',  showTTSbuttonEnabled);
    sitecues.on('speech/disabled', showTTSbuttonDisabled);

    create();

    // panel is ready
    callback();
  });

});
