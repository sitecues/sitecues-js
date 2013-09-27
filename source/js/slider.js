sitecues.def("slider", function (slider, callback, log) {
  'use strict';

  sitecues.use("jquery", "conf", "zoom",  function ($, conf, zoom) {

    // #### SLIDER INTERFACE #########################################################################

    // There's some really weird scoping going on in this library. Maybe at the core/def level. - Al
    var global_slider = slider;

    // Stack of sliders: used to update * sliders linked to zoom
    global_slider.stack = [];

    // Make the slider instances accessible for fuctional testing by adding the slider stack to the uiManager
    sitecues.ui.sliders = global_slider.stack;

    // Interface to instantiate the Slider
    global_slider.build = function (props) {
      return new SliderClass(props, global_slider);
    };

    global_slider.destroyInstances = function () {
    };



    // #### SLIDER CLASS #############################################################################

    function SliderClass (props, slider_interface) {

      // Store a reference to the Slider's container element
      this.$container = $(props.container);

      // Over-ride the default color object if a new one is passed
      if (props.color) {
        this.color = props.color;
      }

      if (props.width) {
        this.width = props.width;
      }

      if (props.height) {
        this.height = props.height;
      }

      // Reference the SliderClass interface
      this.interface = slider_interface;

      // Add this instance to a stack of sliders
      slider_interface.stack.push(this);

      // Set an index on the instance: useful for debugging events that are fired to multiple sliders
      this.index = slider_interface.stack.length;

      // Initialize this new Slider instance
      this.init();
    };



    SliderClass.prototype = {

      // Settings

      // Number of milliseconds to wait before updating zoom when mouse is held down over a letter
      letterZoomDelay: 50,
      // NOTE: Magic number 768 is default original width of SVG document
      originalWidth: 690,
      // Half the width of the SVG thumb element at it's original size
      originalThumbWidth: 84,
      
      // TODO: Make the color settings object configurable on instantiation using deep object merge

      // Color settings object
      color: {
        letterSmlBack     : { normal: "#000000", hover: "#000000"},
        trackBack         : { normal: "#000000", hover: "#000000"},
        letterBigBack     : { normal: "#000000", hover: "#000000"},
        letterSml         : { normal: "#FFFFFF", hover: "#FFFFFF"},
        track             : { normal: "#0045AD", hover: "#0045AD"},
        thumb             : { normal: "#FFFFFF", hover: "#FFFFFF"},
        letterBig         : { normal: "#FFFFFF", hover: "#FFFFFF"},
      },

      // The default width & height dimensions are overwritten with the DOM containers's dimensions
      // width: 690,
      // height: 161,



      // Initialize the slider vars and call draw
      init: function (props) {
        
        this.create();
        this.setdimensions();
        this.bindevents();

        // Set to the zoomLevel in conf, or set to zoom.defaultLevel
        this.zoomLevel = conf.get('zoom') || zoom.defaultLevel;
        
        // Update the Thumb position based on the conf.zoom or zoom.defaultLevel value
        this.setThumbPositionFromZoomLevel(this.zoomLevel);
        this.translateThumbSVG();

      },

      buildsvg: function (slider, color) {

        return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+

          'width="'+slider.width+'" height="'+slider.height+'" viewBox="0, 0, 690, 161" preserveAspectRatio="none">' +
          '<path cursor="pointer" class="letterSmlBack" fill="'+color.letterSmlBack.normal+'"                         d="M-0,0 L106.906,0 L106.906,161 L-0,161 z" />' +
          '<path cursor="pointer" class="trackBack"     fill="'+color.trackBack.normal+'"                             d="M106.906,0 L539.23,0 L539.23,161 L106.906,161 z" />' +        
          '<path cursor="pointer" class="letterBigBack" fill="'+color.letterBigBack.normal+'"                         d="M539.23,0 L690,0 L690,161 L539.23,161 z" fill="#000000" />"' +
          '<path cursor="pointer" class="letterSml"     fill="'+color.letterSml.normal+'"                             d="M65.629,128.755 L39.728,128.755 L35.342,145.475 L16.803,145.475 L42.351,72.953 L63.434,72.953 L89.611,145.475 L70.706,145.475 z M61.648,116.091 L52.898,90.768 L44.21,116.091 z" />' +
          '<path cursor="pointer" class="track"         fill="'+color.track.normal+'" stroke="'+color.track.normal+'" d="M122.85,106.69 L513.778,78.484 L514.03,105.905 L123.101,107.739 z" stroke-width="12" stroke-linejoin="round" />' +
          '<path cursor="pointer" class="thumb"         fill="'+color.thumb.normal+'" stroke="'+color.thumb.normal+'" d="M-12.044,116.381 L-12.044,57.264 L11.54,57.264 L11.54,116.381 L0.534,141.0 z" stroke-width="8" stroke-linejoin="round" />' +
          '<path cursor="pointer" class="letterBig"     fill="'+color.letterSml.normal+'"                             d="M633.227,117.08 L590.014,117.08 L582.106,145.0 L551.484,145.0 L594.99,24.213 L629.008,24.213 L672.199,145.0 L640.91,145.0 z M626.008,96.026 L611.553,54.033 L597.186,96.026 z" />' +  
        '</svg>';

      },

      // Set the bounds of the Slider's container element
      setcontainerbounds: function(){

        // FIXME: This was commented out because the CSS is loading AFTER the JavaScript. Thus...
        // dimensions should not be dynamically set based on DOM values. UI.js does not check that
        // CSS files have been loaded, so scripts execute before DOM dimesions have been set.
          
        // Read the bounds of the container
        var bounds = this.$container.get(0).getBoundingClientRect();

        // Set the width and height of the Slider's container
        // But don't overwrite values that have been passed if the container has no dimensions
        // this.width = bounds.width || this.width;
        // this.height = bounds.height || this.height;

      },

      // Set the bounds of the SVG DOM element (auto-resizes svg elements)
      setsvgbounds: function(){
        
        // Set the width and height attributes of the root SVG element
        this.svg.viewBox.attr('width', this.width);
        this.svg.viewBox.attr('height', this.height);
        
      },



      // Build and reference the SVG elements
      create: function () {

        this.setcontainerbounds();

        // Build the SVG paths and return the HTML string result
        this.svgXml = this.buildsvg(this, this.color);

        // Put the SVG into the DOM
        this.$container.html(this.svgXml);

        // Get the newly create SVG DOM element
        var $svgElem = $(this.$container).find('svg');

        // Store the references to the live SVG DOM elements on this Slider instance
        this.svg = {
          viewBox       : $svgElem, //
          letterSmlBack : $svgElem.find('.letterSmlBack'),
          trackBack     : $svgElem.find('.trackBack'),
          letterBigBack : $svgElem.find('.letterBigBack'),
          letterSml     : $svgElem.find('.letterSml'),
          track         : $svgElem.find('.track'), //
          thumb         : $svgElem.find('.thumb'),
          letterBig     : $svgElem.find('.letterBig'),
        };
      },



      // Bind event listeners to DOM elements
      bindevents: function () {
        
        // Alias Slider.color, Slider.svg $document for convenience
        var $document = $(document)
        ,   color     = this.color
        ,   svg       = this.svg
        ;

        // Internal Function to set hover events
        var setHover = function (component) {
          $(svg[component]).hover(function(){
            $(this).attr('fill', color[component].hover);
            // TODO: Update mouse pointer
          },function(){
            $(this).attr('fill', color[component].normal);
            // TODO: Update mouse pointer
          });
        };

        // Loop through each component and set the hover event
        for (var component in color) {
          setHover(component);
        }

        // Set the context (this) to be used in the event listener callbacks
        var context = { slider: this };
        
        // Global mouseup listener
        $document         .on('mouseup',   context, this.mouseup);

        // Track & Thumb Event Listeners
        svg.track         .on('mousedown', context, this.mousedowntrack);
        svg.trackBack     .on('mousedown', context, this.mousedowntrack);
        svg.thumb         .on('mousedown', context, this.mousedowntrack);
        $document         .on('mousemove', context, this.dragthumb);      
        
        // Letter Event Listeners
        svg.letterSml     .on('mousedown', context, this.mousedownlettersml);
        svg.letterSmlBack .on('mousedown', context, this.mousedownlettersml);
        svg.letterBig     .on('mousedown', context, this.mousedownletterbig);
        svg.letterBigBack .on('mousedown', context, this.mousedownletterbig);

        // Pass slider instance to anonfunc to set correct context of slider when called from conf
        (function(slider_){

          // Update the Thumb element's position based on the zoom level now dimensions have changed
          conf.get('zoom', function (zoomLevel) {

            // Set to the zoomLevel in conf, or set to zoom.defaultLevel
            slider_.zoomLevel = zoomLevel || zoom.defaultLevel;

            // Only respond to conf zoom updates when mouse not down
            if (!slider_.mouseDownTrack) {
              
              // Update the Thumb position
              slider_.setThumbPositionFromZoomLevel.call(slider_, slider_.zoomLevel);
              slider_.translateThumbSVG.call(slider_);

            }

          });

          // Reize events require a recalculation of dimensions
          sitecues.on('resize/end', function(){ slider_.setdimensions.call(slider_); });

        })(slider);

      },


      // Switch off user-select
      disablebodyselect: function () {

        $('html').css({
          '-webkit-user-select' : 'none',     /* Chrome all / Safari all */
          '-moz-user-select'    : 'none',     /* Firefox all */
          '-ms-user-select'     : 'none',     /* IE 10+ */
          /* No support for these yet, use at own risk */
          // '-o-user-select': 'none',
          // 'user-select': 'none'
        });
        
      },



      // When the mouse is is pressed over the Track, Thumb and TrackBack
      mousedowntrack: function (e) {

        sitecues.emit('panel/interaction');

        // Get the context when called from event mousemove event listener
        var slider = e.data.slider;

        slider.disablebodyselect();

        // Store the state of the mousedown
        slider.mouseDownTrack = true;

        slider.dragthumb(e);

      },

      // TODO: These following two functions are very similar, we can pack this down later............

      // When the mouse is is pressed over the Letter or LetterBack
      mousedownlettersml: function (e) {
        
        sitecues.emit('panel/interaction');

        // Get the context when called from event mousedown event listener
        var slider = e.data.slider;

        slider.disablebodyselect();

        // Store the state of the mousedown
        slider.mouseDownLetterSml = true;

        // Set interval while the mouse is pressed over the letter and held down
        slider.letterIntervalSml = setInterval(function(){
          
          // Call the letterupdate function to adjust zoom, passing it the correct context
          sitecues.emit('zoom/decrease');

        // Finalize the interval call with the delay setting
        }, slider.letterZoomDelay);

        // Fire initial zoom update on original mouse down event
        sitecues.emit('zoom/decrease');

      },

      // When the mouse is is pressed over the LetterBig or LetterBigBack
      mousedownletterbig: function (e) {

        sitecues.emit('panel/interaction');
        
        // Get the context when called from event mousedown event listener
        var slider = e.data.slider;

        slider.disablebodyselect();

        // Store the state of the mousedown
        slider.mouseDownLetterBig = true;

        // Set interval while the mouse is pressed over the letter and held down
        slider.letterIntervalBig = setInterval(function(){
          
          // Call the letterupdate function to adjust zoom, passing it the correct context
          sitecues.emit('zoom/increase');

        // Finalize the interval call with the delay setting
        }, slider.letterZoomDelay);

        // Fire initial zoom update on original mouse down event
        sitecues.emit('zoom/increase');

      },

      // When the mouse is unpressed anywhere
      mouseup: function (e) {

        // Get the context when called from event mousedown event listener
        var slider = e.data.slider;

        // Update the state of the mousedown on 
        slider.mouseDownTrack     = false;
        slider.mouseDownLetterSml = false;
        slider.mouseDownLetterBig = false;

        // Switch off user-select on when the mouse is released
        $('html').css({
          '-webkit-user-select' : 'text',  /* Chrome all / Safari all */
          '-moz-user-select'    : 'text',     /* Firefox all */
          '-ms-user-select'     : 'text',      /* IE 10+ */
          /* No support for these yet, use at own risk */
          // '-o-user-select': 'auto',
          // 'user-select': 'auto'
        });


        // Clear mousedown timers on zoom letters
        clearInterval(slider.letterIntervalSml);
        clearInterval(slider.letterIntervalBig);

      },



      // Update the position of the Thumb
      dragthumb: function (e) {

        // Get the context when called from event mousemove event listener
        var slider = e.data.slider;
        
        // If the slider has put the mouse-down inside the Slider Track Back bounds...
        if (slider.mouseDownTrack) {

          
          //slider.trackBounds = slider.svg.track.get(0).getBoundingClientRect(;
          
          // Get the postition of the mouse relative to the Slider
          var thumbX = e.clientX - slider.trackBounds.left + $(document).scrollLeft();

          // Contain the Thumb position in the Track bounds
          if (thumbX < 0) {
            thumbX = 0;
          }
          if (thumbX > slider.trackBounds.width) {
            thumbX = slider.trackBounds.width;
          }
                  
          // Calculate the zoom based on the mouseX position
          var zoomLevel = slider.calcZoomLevel.call(slider, thumbX);
          
          // Calculate the position of the Thumb relative to the zoom level and SVG elemss
          slider.thumbPos = slider.calcThumbPos.call(slider, zoomLevel);

          // Translate the Thumb SVG element (slide the thumb)
          slider.translateThumbSVG.call(slider);

          // Set the new zoom level in conf
          conf.set('zoom', zoomLevel);
        }

      },


      // Calculate the sitecues-zoom-level-value, from the current position of the Slider's Thumb
      calcZoomLevel: function (thumbX) {
        return (zoom.range / this.trackBounds.width * thumbX) + zoom.min;
      },

      // Calculate Thumb Position for the Thumb SVG element, from the rge sitecues-zoom-level-value
      calcThumbPos: function (zoomLevel) {
        return this.trackOffsetLeft*slider.aspect  +  this.trackClientWidth*this.aspect/zoom.range  *  (zoomLevel-zoom.min);
      },



      // Calculate the dimensions of dynamic Slider components
      setdimensions: function (e) {

        // Set the context, allowing setdimensions to be called from any scope
        if (e && e.data && e.data.slider) {
          slider = e.data.slider;
        } else if (e) {
          slider = e;
        } else {
          slider = this;
        };

        // Reset element bounding box, incase the dom size changes
        slider.setcontainerbounds.call(slider);
        slider.setsvgbounds.call(slider);

        // Get the aspect horizontal aspect ratio of the Slider
        slider.aspect = slider.originalWidth/slider.width;

        // Get the bounding box of the Slider-Track
        slider.trackBounds = slider.svg.track.get(0).getBoundingClientRect();
        
        // Get the pixel-width of the Slider-Track
        slider.trackClientWidth = slider.trackBounds.width;
        
        // Get the left-offset of the Slider's container, relative to the document
        slider.containerLeft = slider.svg.viewBox.get(0).getBoundingClientRect().left;
        
        // Get the horizontal distance between the left position of the Slider Container and the Track
        slider.trackOffsetLeft = slider.trackBounds.left - slider.containerLeft;

        // Set the internal Thumb Position incase the dimensions changed
        slider.setThumbPositionFromZoomLevel.call(slider, slider.zoomLevel);
        
        // Translate the SVG Thumb element based on the new internal Thumb Position
        slider.translateThumbSVG.call(slider);

      },

      // Report how many pixels the thumb position needs to be dragged before sitecues zooms by a zoom.step
      reportThumbDragPixelsPerZoomStep: function (){        
        var slider = this;

        function getPos (zoomLevel) {
          return slider.trackOffsetLeft + slider.trackClientWidth/zoom.range * (zoomLevel-zoom.min);
        }
      
        return getPos(1+zoom.step) - getPos(1);
      },

      // Set the Slider's internal thumb position variable based on the zoom level
      setThumbPositionFromZoomLevel: function (zoomLevel){

        // Calculate the new position of the Thumb
        this.thumbPos = this.trackOffsetLeft*this.aspect  +  this.trackClientWidth*this.aspect/zoom.range  *  (zoomLevel-zoom.min);

      },

      // Move the SVG thumb element based on the dimensions of the Slider
      translateThumbSVG: function () {
        this.svg.thumb.attr('transform', 'translate('+ (this.thumbPos) +')');
      },



      destroy: function () {
      }

    }; // END: SliderClass.prototype
    
    if (sitecues.tdd) {
      exports.globalSliderInterface = global_slider;
      exports.SliderClass = SliderClass;
    }

    // Core callback
    callback();

  });  // END: use
}); // END: def