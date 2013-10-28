sitecues.def( 'panel', function (panel, callback, log) {
  
  'use strict';

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use( 'jquery', 'conf', 'speech', 'slider', 'util/positioning', 'ui', 'util/common', 'zoom', 'html-build', 'platform', function( $, conf, speech, SliderClass, positioning, ui, common, zoom, htmlBuild, platform) {

    // timer needed for handling
    // ui mistake - when user occasionally
    // move mouse cursor out of panel
    var timer;

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

    // PANEL OBJECT'S METHODS

    // Create panel element.
    panel.create = function() {

      // private variables
      var frame, ttsButton;

      // create element and add element id for proper styling
      frame = htmlBuild.$div()
        .attr('id','sitecues-panel')
        .css('display','none');
    
      // Create a Slider Instance for the Panel
      this.slider = {};
      this.slider.wrap = $('<div>').addClass('slider-wrap').appendTo(frame);
      this.slider.widget = SliderClass.build({
        width: 340,
        height:80,
        container: this.slider.wrap,
        color: {
          letterSmlBack     : { normal: 'rgba(0,0,0,0)', hover: 'rgba(0,0,0,0)'},
          trackBack         : { normal: 'rgba(0,0,0,0)', hover: 'rgba(0,0,0,0)'},
          letterBigBack     : { normal: 'rgba(0,0,0,0)', hover: 'rgba(0,0,0,0)'},
          letterSml         : { normal: '#000000', hover: '#000000'},
          track             : { normal: '#000000', hover: '#000000'},
          thumb             : { normal: '#3265c1', hover: '#3265c1'},
          letterBig         : { normal: '#000000', hover: '#000000'},
        }
      });

      // Body Width Calc Guide
      $('<div>', {
        id: 'sitecues-BWCG',
        css:{
          position:'absolute',
          width:'100%',
          height:'1px',
          'pointerEvents':'none',
          top:'0px',
          left:'0px',
          display:'hidden'
        },
      }).appendTo('html');
    
     // create TTS button and set it up
      ttsButton = $('<div>').addClass('tts').appendTo(frame);
      
      if ( speech.isEnabled() && conf.get('tts-service-available') === true ) {
        ttsButton.data( 'tts-enable', 'enabled' );
      } else {
        ttsButton.addClass( 'tts-disabled' );
        ttsButton.data( 'tts-enable', 'disabled' );
      }
      ttsButton.click(function() {
        sitecues.emit('panel/interaction');
        panel.ttsToggle();
      });

      if (panel.parent) {
        panel.parent.click(function(e) {
          e.preventDefault();
          return false;
        });
      }

      frame.appendTo('html');

      // Set panel to 'created'
      this.created = true;

      this.element = frame;
      
      // return panel
      return frame;
    };


    // Show panel.
    panel.show = function(){
      
      // Variables used further down within this very large function
      // Probably worth breaking this function down a lot - Al
      var badgeRect
        , badgeTop
        , badgeLeft
        , viewport
        , topQ
        , leftQ
        , absolute
        , sliderWidget
        ;

      // Clear timer if present
      if (timer) {
        clearTimeout(timer);
      }

      panel.element.hide();
      // Reset styles if any were set
      
      panel.element.style({
        'top'     : '',
        'bottom'  : '',
        'left'    : '',
        'right'   : ''
      }, '', 'important');

      // Do we have a badge reference?  If no reference is passed then we
      // don't really know where we're supposed to put the panel.
      if (panel.parent) {
        
        badgeRect = $(panel.parent).get(0).getBoundingClientRect();
         
        // These will tell us where the badge isSticky  
        badgeTop = 0;
        badgeLeft = 0;
        viewport = positioning.getViewportDimensions(0, conf.get('zoom'));

        // Set up some standard measurements
        if (platform.browser.isFirefox) {
          badgeTop = (window.pageYOffset + badgeRect.top)/conf.get('zoom');
          badgeLeft = (window.pageXOffset + badgeRect.left)/conf.get('zoom');
        } else {
          badgeTop = badgeRect.top;
          badgeLeft = badgeRect.left;
        }

        // These two variables will tell us which -quadrant we're in
        topQ = badgeTop < (viewport.height / 2);
        leftQ = badgeLeft < (viewport.width / 2);

        // Match the type of positioning of the parent/badge.  Trying to pin a
        // fixed element to an absolute element is tricky if not impossible.
        absolute = panel.parent.offsetParent().css('position') === 'absolute';
        
        if(absolute) {
          panel.element.css('position','absolute');
        }

        if (topQ) {
          log.info('Badge is in top half of page (' + panel.parent.offset().top + ')');
          panel.element.style('top', (panel.parent.offset().top - positioning.getScrollPosition().top) * conf.get('zoom') + 'px', 'important');
        } else {
          log.info('Badge is in bottom half of page');
          // We can't use the 'bottom' property here because jQuery won't animage properly off of it.
          panel.element.style('top', (((panel.parent.offset().top + (panel.parent.height()/2)) - (panel.element.height()/2)) - positioning.getScrollPosition().top) * conf.get('zoom') + 'px', 'important');
        }

        if(leftQ) {
          log.info('Badge is in left half of page');
          panel.element.style('left', Math.min(panel.parent.offset().left, $(window).width() - panel.element.width()) + 'px', 'important');
        } else {
          log.info('Badge is in right half of page');
          if(((panel.parent.offset().left + panel.parent.width()) - panel.element.width()) < 0) {
            // The panel would go off the left side of the screen
            panel.element.style('right', panel.element.width() + 'px', 'important');
            panel.element.style('opacity', 0.5, 'important');
          } else {
            // The panel will fit on the screen
            if(absolute) {
              panel.element.style('right', viewport.width- (panel.parent.offset().left + panel.parent.width()) + 'px', 'important');
            } else {
              panel.element.css('right',($(window.width) - (panel.parent.offset().left) + panel.parent.width())+ 'px', 'important');
            }
          }
        }
      }

      panel.element.animate({
          width   : 'toggle',
          height  : 'toggle',
          opacity : 1.0
        },
        750,
        function() {
          sitecues.emit('panel/show', panel.element);
          
          // Set/recheck the dimensions of the slider
          var sliderWidget = panel.slider.widget;
          sliderWidget.setdimensions(sliderWidget);
          sliderWidget.setThumbPositionFromZoomLevel.call(sliderWidget, sliderWidget.zoomLevel);
          sliderWidget.translateThumbSVG.call(sliderWidget);
        }
      );

      // Set/recheck the dimensions of the slider
      sliderWidget = panel.slider.widget;
      sliderWidget.setdimensions(sliderWidget);
      sliderWidget.setThumbPositionFromZoomLevel.call(sliderWidget, sliderWidget.zoomLevel);
      sliderWidget.translateThumbSVG.call(sliderWidget);


      panel.element.hover(function() {
        // Hover in.
        panel.element.data('hover','true');
      }, function() {
        // Hover out.
        panel.element.data('hover','false');
      });
    };

    // Hide panel.
    panel.hide = function(){
      if(panel.element.data('hover') === 'true' || panel.element.data('badge-hover') === 'true') {
        // We're hovering over the element, delay hiding it.
        setTimeout(panel.hide, panel.hideDelay);
        return;
      }
      if (panel.isSticky===false) {
        // Hide panel.
        panel.element.fadeOut('fast', function(){
          // Notify about panel hiding.
          sitecues.emit('panel/hide', panel.element);
        });
      }
    };

    // Function that will toggle tts on or off.
    panel.ttsToggle = function() {
      var ttsButton = $('#sitecues-panel .tts');
      if(ttsButton.data('tts-enable') === 'disabled' && conf.get('tts-service-available') === true ) {
        // It's disabled, so enable it
        sitecues.emit('speech/enable');
        showTTSbuttonEnabled(ttsButton);
      } else {
        // It's enabled (or unknown), so disable it
        sitecues.emit('speech/disable');
        showTTSbuttonDisabled(ttsButton);
      }
    };

    // Show TTS is enabled.
    function showTTSbuttonEnabled(ttsButton) {
      ttsButton = ttsButton || $('#sitecues-panel .tts');
      ttsButton.data('tts-enable','enabled');
      ttsButton.removeClass('tts-disabled');
    }

    // Show TTS is disabled.
    function showTTSbuttonDisabled (ttsButton) {
      ttsButton = ttsButton || $('#sitecues-panel .tts');
      ttsButton.data('tts-enable','disabled');
      ttsButton.addClass('tts-disabled');
    }

    // EVENT HANLERS

    // Setup trigger to show panel.
    sitecues.on('badge/hover', function() {
      panel.show();
      panel.element.data('badge-hover','true');
    });

    // Setup trigger to show panel.
    sitecues.on('badge/leave', function() {
      panel.element.data('badge-hover','false');
      setTimeout(panel.hide, panel.hideDelay);
    });

    sitecues.on('speech/enabled',  showTTSbuttonEnabled);
    sitecues.on('speech/disabled', showTTSbuttonDisabled);

    panel.create();

    // Adjust the position of the toolbar items when the document vertical scrollbar appears
    sitecues.on('zoom/documentScrollbarShow', function(scrollbarWidth){

      // Get the right position of the panel
      var   panelRight = $('#sitecues-panel').css('right')

      // Calculate the updated position
      , newRightValPanel    = (parseFloat(panelRight) - scrollbarWidth) +'px'
      ;

      // Set the updated CSS position
      $('#sitecues-panel').css({right: newRightValPanel});

    });

    // Adjust the position of the toolbar items when the document vertical scrollbar disappears
    sitecues.on('zoom/documentScrollbarHide', function(scrollbarWidth){
   
      // Get the right position of the panel
      var   panelRight = $('#sitecues-panel').css('right')

      // Calculate the updated position
      , newRightValPanel    = (parseFloat(panelRight) + scrollbarWidth) +'px'
      ;

      // Set the updated CSS position
      $('#sitecues-panel').css({right: newRightValPanel});
    
    });

    // panel is ready
    callback();
  });

});