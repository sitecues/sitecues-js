sitecues.def( 'panel', function (panel, callback, log) {

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use( 'jquery', 'conf', 'speech', 'slider', 'util/positioning', 'ui', 'util/common', function( $, conf, speech, SliderClass, positioning, ui, common) {

    // timer needed for handling
    // ui mistake - when user occasionally
    // move mouse cursor out of panel
    var timer;

    panel.hideDelay = 1000;
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

    // panel element
    panel.create = function() {

      // private variables
      var frame, wrap, slider, ttsButton;

      // create element and add element id for proper styling
      frame = $('<div>', {
        'id': 'sitecues-panel',
        css:{
          'display':'none'
        }
      });
    
      // Create a Slider Instance for the Panel
      this.slider = {};
      this.slider.wrap = $('<div>').addClass('slider-wrap').appendTo(frame);
      this.slider.widget = SliderClass.build({
        container: this.slider.wrap,
        color: {
          letterSmlBack     : { normal: "rgba(0,0,0,0)", hover: "rgba(0,0,0,0)"},
          trackBack         : { normal: "rgba(0,0,0,0)", hover: "rgba(0,0,0,0)"},
          letterBigBack     : { normal: "rgba(0,0,0,0)", hover: "rgba(0,0,0,0)"},
          letterSml         : { normal: "#000000", hover: "#000000"},
          track             : { normal: "#000000", hover: "#000000"},
          thumb             : { normal: "#1D3D8E", hover: "#1D3D8E"},
          letterBig         : { normal: "#000000", hover: "#000000"},
        }
      });
    
      // create TTS button and set it up
      ttsButton = $('<div>').addClass('tts').appendTo(frame);
      if ( speech.isEnabled() && conf.get('tts-service-available') === true ) {
        ttsButton.data( 'tts-enable', 'enabled' );
      } else {
        ttsButton.addClass( "tts-disabled" );
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
        // This version of the panel will be fixed.
        frame.css({"left": '', "right": '', position: 'fixed'});
        var scroll = positioning.getScrollPosition();
        //We're going to leave the panel as a root-level element with position:fixed, but we're going to set it
        // positioning.centerOn(panel.element, positioning.getCenter(panel.parent), conf.get('zoom'), 'fixed');
        var panelTop = positioning.getOffset(panel.parent).top - scroll.top - 40;
        if(panelTop < 0) {
          panelTop = 0;
        }
        frame.style("top", panelTop, 'important');

        var panelLeft = positioning.getOffset(panel.parent).left + (panel.parent.width() / 2) - scroll.left - 250;
        if(panelLeft < 0) {
          panelLeft = 0;
        }
        frame.style("left", panelLeft, 'important');
        frame.prependTo('html');
      } else {
        // In this 'else' case, we are using the default badge. This doesn't seem right... we should always
        // have a parent, and in this case the default badge should be the parent. However, 2 days before a
        // major release is not the time for drastic changes to working features...

        // Right align the panel, but do this is a way in which the (dis)appearance of the
        // body vertical scrollbar will not affect placement. To do this, put the panel in
        // a 'placer' element to allow for the proper animation direction.
        var placer = $('<div>').attr('id', 'sitecues-panel-placer');

        // Add the panel to placer.
        frame.appendTo(placer);

        // This version of the panel will be positioned absolute to the placer.
        frame.css({position: 'absolute'});

        // Set up the scrollbar-ignoring right placement.
        placer.prependTo('html');
        var placerVisibleWidth = placer.outerWidth();
        common.addRightAlignIgnoreScrollbar({
          obj: panel,
          getWidth: function() { return placerVisibleWidth;},
          getRightOffset: function() { return 5; },
          setCss: function(jCssObj) { placer.css(jCssObj); }
        });

        panel.placer = placer;
      }

      panel.element = frame;

      // Set panel to 'created'
      this.created = true;
      this.element = frame;

      return frame;
    };

    // show panel
    panel.show = function(){
      // clear timer if present
      timer && clearTimeout(timer);

      // Animate instead of fade
      panel.element.hide();
      panel.element.animate({
          // right: '+=0',
          width: 'toggle',
          height: 'toggle',
          opacity: 1.0
        },
        750,
        function() {
          sitecues.emit('panel/show', panel.element);
          
          // Set/recheck the dimensions of the slider
          var sliderWidget = panel.slider.widget;
          sliderWidget.setdimensions(sliderWidget);
          sliderWidget.setThumbPositionFromZoomLevel.call(sliderWidget, sliderWidget.zoomLevel);
          sliderWidget.translateThumbSVG.call(sliderWidget);
      });

      // Set/recheck the dimensions of the slider
      var sliderWidget = panel.slider.widget;
      sliderWidget.setdimensions(sliderWidget);
      sliderWidget.setThumbPositionFromZoomLevel.call(sliderWidget, sliderWidget.zoomLevel);
      sliderWidget.translateThumbSVG.call(sliderWidget);


      panel.element.hover(function() {
        //Hover in
        panel.element.data('hover','true');
      }, function() {
        //Hover out
        panel.element.data('hover','false');
      });
    }

    // hide panel
    panel.hide = function(){

      if(panel.element.data('hover') === 'true' || panel.element.data('badge-hover') === 'true') {
        // We're hovering over the element, delay hiding it
        setTimeout(panel.hide, panel.hideDelay);
        return;
      }

      // hide panel
      panel.element.fadeOut('fast', function(){

        // notify about panel hiding
        sitecues.emit('panel/hide', panel.element);

      });

    };

    // delete the panel
    panel.delete = function(){
      if (panel.placer) {
        panel.placer.remove();
        common.removeRightAlignIgnoreScrollbar(panel);
        panel.placer = undefined;
      } else {
        panel.element.remove();
      }
      panel.element = undefined
    };

    // Function that will toggle tts on or off
    panel.ttsToggle = function() {
      var ttsButton = $('#sitecues-panel .tts');
      if(ttsButton.data('tts-enable') === 'disabled' && conf.get('tts-service-available') === true ) {
        // It's disabled, so enable it
        sitecues.emit('speech/enable');
        ttsButton.data('tts-enable','enabled');
        ttsButton.removeClass("tts-disabled");
      } else {
        // It's enabled (or unknown), so disable it
        sitecues.emit('speech/disable');
        ttsButton.data('tts-enable','disabled')
        ttsButton.addClass("tts-disabled");
      }
    };


    // setup trigger to show panel
    sitecues.on('badge/hover', function() {
      panel.show();
      panel.element.data('badge-hover','true');
    });

    // setup trigger to show panel
    sitecues.on('badge/leave', function() {
      panel.element.data('badge-hover','false');
      setTimeout(panel.hide, panel.hideDelay);
    });


    panel.create();

    // panel is ready
    callback();
  });

});