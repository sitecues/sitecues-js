sitecues.def("slider", function (slider, callback, log) {
sitecues.use("jquery", "conf", "zoom", function ($, conf, zoom) {



  // #### SLIDER INTERFACE #########################################################################

  // There's some really weird scoping going on in this library. Maybe at the core/def level. - Al
  var _slider = slider;

  // Stack of sliders: used to update * sliders linked to zoom
  _slider.stack = [];

  // Interface to instantiate the Slider
  _slider.build = function (props) {
    return new SliderClass(props, _slider);
  };

  _slider.destoryInstances = function () {
  };

  // #### SLIDER CLASS #############################################################################

  SliderClass = function (props, interface) {

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
    this.interface = interface;

    // Add this instance to a stack of sliders
    interface.stack.push(this);

    // Set an index on the instance: useful for debugging events that are fired to multiple sliders
    this.index = interface.stack.length;

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
      letterSmlBack     : { normal: "rgba(0,0,0,0)", hover: "rgba(100,100,100,0.5)"},
      trackBack         : { normal: "rgba(0,0,0,0)", hover: "rgba(100,100,100,0.5)"},
      letterBigBack     : { normal: "rgba(0,0,0,0)", hover: "rgba(100,100,100,0.5)"},
      letterSml         : { normal: "#FFFFFF", hover: "#FFFFFF"},
      track             : { normal: "#0045AD", hover: "#0045AD"},
      thumb             : { normal: "#FFFFFF", hover: "#FFFFFF"},
      letterBig         : { normal: "#FFFFFF", hover: "#FFFFFF"},
    },

    // The default width & height dimensions are overwritten with the DOM containers's dimensions
    width: 690,
    height: 161,



    // Initialize the slider vars and call draw
    init: function (props) {
      this.create();
      this.setdimensions();
      this.bindevents();
    },

    buildsvg: function (slider, color) {

      return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+

        'width="'+slider.width+'" height="'+slider.height+'" viewBox="0, 0, 690, 161" preserveAspectRatio="none">' +

        '<path class="letterSmlBack"  fill="'+color.letterSmlBack.normal+'"                         d="M-0,0 L106.906,0 L106.906,161 L-0,161 z" />' +
        '<path class="trackBack"      fill="'+color.trackBack.normal+'"                             d="M106.906,0 L539.23,0 L539.23,161 L106.906,161 z" />' +        
        '<path class="letterBigBack"  fill="'+color.letterBigBack.normal+'"                         d="M539.23,0 L690,0 L690,161 L539.23,161 z" fill="#000000" />"' +

        '<path class="letterSml"      fill="'+color.letterSml.normal+'"                             d="M65.629,128.755 L39.728,128.755 L35.342,143.076 L16.803,143.076 L42.351,72.953 L63.434,72.953 L89.611,143.076 L70.706,143.076 z M61.648,116.091 L52.898,90.768 L44.21,116.091 z" />' +

        '<path class="track"          fill="'+color.track.normal+'" stroke="'+color.track.normal+'" d="M122.85,106.69 L513.778,78.484 L514.03,105.905 L123.101,107.739 z" stroke-width="12" stroke-linejoin="round" />' +
        '<path class="thumb"          fill="'+color.thumb.normal+'" stroke="'+color.thumb.normal+'" d="M-12.044,116.381 L-12.044,57.264 L11.54,57.264 L11.54,116.381 L0.534,135.249 z" stroke-width="8" stroke-linejoin="round" />' +

        '<path class="letterBig"      fill="'+color.letterSml.normal+'"                             d="M633.227,117.08 L590.014,117.08 L582.106,140.875 L551.484,140.875 L594.99,24.213 L629.008,24.213 L672.199,140.875 L640.91,140.875 z M626.008,96.026 L611.553,54.033 L597.186,96.026 z" />' +  
      '</svg>';

    },

    // Set the bounds of the Slider's container element
    setcontainerbounds: function(){
        
      // Read the bounds of the container
      var bounds = this.$container.get(0).getBoundingClientRect();

      // Set the width and height of the Slider's container
      this.width = bounds.width;
      this.height = bounds.height;

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
        viewBox       : $svgElem,
        letterSmlBack : $svgElem.find('.letterSmlBack'),
        trackBack     : $svgElem.find('.trackBack'),
        letterBigBack : $svgElem.find('.letterBigBack'),
        letterSml     : $svgElem.find('.letterSml'),
        track         : $svgElem.find('.track'),
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

      // Reize events require a recalculation of dimensions
      $(window)         .on('resize',    context, this.setdimensions);

      // Pass slider instance to anonfunc to set correct context of slider when called from conf
      (function(_slider){

        // Update the Thumb element's position based on the zoom level now dimensions have changed
        conf.get('zoom', function (zoomLevel) {

          _slider.zoomLevel = zoomLevel;

          // Only respond to conf zoom updates when mouse not down
          if (!_slider.mouseDownTrack) {
            
            // Update the Thumb position
            _slider.setThumbPositionFromZoomLevel.call(_slider, zoomLevel);
            _slider.translateThumbSVG.call(_slider);

          }

        });

      })(slider);

    },



    // When the mouse is is pressed over the Track, Thumb and TrackBack
    mousedowntrack: function (e) {

      // Get the context when called from event mousemove event listener
      var slider = e.data.slider;

      // Store the state of the mousedown
      slider.mouseDownTrack = true;

      slider.dragthumb(e);

      // Switch off user-select on the whole body while dragging
      $('body').css({
        '-webkit-user-select': 'none',  /* Chrome all / Safari all */
        '-moz-user-select': 'none',     /* Firefox all */
        '-ms-user-select': 'none',      /* IE 10+ */
        /* No support for these yet, use at own risk */
        // '-o-user-select': 'none',
        // 'user-select': 'none'
      });

    },

    // TODO: These following two functions are very similar, we can pack tis down later

    // When the mouse is is pressed over the Letter or LetterBack
    mousedownlettersml: function (e) {
      
      // Get the context when called from event mousedown event listener
      var slider = e.data.slider;

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
      
      // Get the context when called from event mousedown event listener
      var slider = e.data.slider;

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

      // Clear mousedown timers on zoom letters
      clearInterval(slider.letterIntervalSml);
      clearInterval(slider.letterIntervalBig);

      // Switch off user-select on when the mouse is released
      $('body').css({
        '-webkit-user-select': 'auto',  /* Chrome all / Safari all */
        '-moz-user-select': 'auto',     /* Firefox all */
        '-ms-user-select': 'auto',      /* IE 10+ */
        /* No support for these yet, use at own risk */
        // '-o-user-select': 'auto',
        // 'user-select': 'auto'
      });

    },



    // Update the position of the Thumb
    dragthumb: function (e) {

      // Get the context when called from event mousemove event listener
      var slider = e.data.slider;
      
      // If the slider has put the mouse-down inside the Slider Track Back bounds...
      if (slider.mouseDownTrack) {
        
        // Get the postition of the mouse relative to the Slider
        //slider.thumbPos = e.clientX - slider.trackBounds.left + $(document).scrollLeft();
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



    calcZoomLevel: function (thumbX) {
      return ((zoom.max-zoom.min) / this.trackBounds.width * thumbX) + zoom.min;
    },

    calcThumbPos: function (zoomLevel) {
      var zoomRange = zoom.max-zoom.min;
      var newThumbPos = this.trackOffsetLeft*slider.aspect  +  this.trackClientWidth*this.aspect/zoomRange  *  (zoomLevel-zoom.min);
      return newThumbPos;
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


      // Reset element boundingds incase dom sizes change
      slider.setcontainerbounds.call(slider);
      slider.setsvgbounds.call(slider);

      // Get the aspect horizontal aspect ratio of the Slider
      slider.aspect = slider.originalWidth/slider.width; 

      slider.trackBounds = slider.svg.track.get(0).getBoundingClientRect();
      slider.trackClientWidth = this.trackBounds.width;
      slider.containerLeft = slider.svg.viewBox.get(0).getBoundingClientRect().left;
      slider.trackOffsetLeft = slider.trackBounds.left - slider.containerLeft;

      // console.log(slider.index);

      slider.setThumbPositionFromZoomLevel.call(slider, slider.zoomLevel);
      slider.translateThumbSVG.call(slider);

    },



    // Set the Slider's internal thumb position variable based on the zoom level
    setThumbPositionFromZoomLevel: function (zoomLevel){

      // Calculate the zoom range (I think we should put this in zoom.js) - Al
      var zoomRange  = zoom.max-zoom.min;

      // Calculate the new position of the THumb
      this.thumbPos = this.trackOffsetLeft*this.aspect  +  this.trackClientWidth*this.aspect/zoomRange  *  (zoomLevel-zoom.min);

    },

    // Move the SVG thumb element based on the dimensions of the Slider
    translateThumbSVG: function () {
      this.svg.thumb.attr('transform', 'translate('+ (this.thumbPos) +')');
    },



    destroy: function () {
    }

  }; // END: SliderClass.prototype
  


  // Core callback
   callback();

})  // END: use
}); // END: def