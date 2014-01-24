sitecues.def( 'panel', function (panel, callback, log) {
  
  'use strict';

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use( 'jquery', 'conf', 'speech', 'slider', 'util/positioning', 'ui', 'util/common', 'zoom', 'html-build', 'platform', function( $, conf, speech, SliderClass, positioning, ui, common, zoom, htmlBuild, platform) {

    // timer needed for handling
    // ui mistake - when user occasionally
    // move mouse cursor out of panel
    var timer;
    var getTranslate = (function () {
      var _MATRIX_REGEXP = /matrix\s*\(\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*,\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*\)/i;
      return function (element) {
        if ($(element).css('transform') === 'none') {
          return [0, 0];
        }
        var transformArray = _MATRIX_REGEXP.exec($(element).css('transform'))[0].split(','),
            translateX = transformArray[4],
            translateY = transformArray[5];
        return [parseFloat(translateX), parseFloat(translateY)];
      }
    }());
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
    function bodyHasVertScrollbar () {
      // See if the document width is within some delta of the window inner width.
      var result = ((window.innerWidth - $(document.documentElement).outerWidth()) > 3);
      return result;
    }
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
          letterBig         : { normal: '#000000', hover: '#000000'}
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
        }
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
        , $panel
        , useLeft
        , left
        , right
        , translateX
        , translateY
        , hasScrollbar = bodyHasVertScrollbar()
        ;

      // Clear timer if present
      if (timer) {
        clearTimeout(timer);
      }

      panel.element.hide();

      // Do we have a badge reference?  If no reference is passed then we
      // don't really know where we're supposed to put the panel.
      if(panel.parent) {
        badgeRect = $('#sitecues-badge').get(0).getBoundingClientRect();
        zoom = positioning.getTotalZoom(panel.parent, true);
        $panel = panel.element;
        left = right = '';

        // Would panel go off the right side of screen? If YES -> open to the left
        useLeft = badgeRect.left * zoom +  $panel.width() + 15 < window.innerWidth;
        if (useLeft) { /* Panel moved, expands right */
          left = ((badgeRect.left / conf.get('zoom') / conf.get('zoom') - 5)) + 'px';
        }
        else {  /* Panel expands left */
          
          if (!platform.browser.isIE) {
            right = ((document.documentElement.clientWidth - badgeRect.right) / conf.get('zoom') - 4 / conf.get('zoom'));
          } else {
            right = ((document.documentElement.clientWidth - badgeRect.right) - 4);
          }
          
          if (hasScrollbar && $('#sitecues-badge').css('position') === 'fixed') {
            right += 15 / conf.get('zoom');
          }
          right += 'px';
        }

        $panel.style({
          top:  ((badgeRect.top / conf.get('zoom') - 5/conf.get('zoom') + parseFloat($('#sitecues-badge').css('padding-top')))) + 'px',
          left: left,
          right: right         
        }, '', 'important');
        if (!platform.browser.isIE) {
          if (!useLeft) {
            $panel.css({
              'transform-origin': '100% 0%',
              'transform': 'scale('+ 1/conf.get('zoom') +') translate(' + window.pageXOffset + 'px, ' + window.pageYOffset + 'px)'
            });
          } else {
            $panel.css({
              'transform-origin': '50% 0%',
              'transform': 'scale('+ 1/conf.get('zoom') +') translate(' + window.pageXOffset + 'px, ' + window.pageYOffset + 'px)'
            });
          }
        }
       
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

      setSliderDimensions();

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

    // EVENT HANDLERS

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

    // panel is ready
    callback();
  });

});