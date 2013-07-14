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

  // Updates the Thumb position of all the sliders in the stack
  _slider['update-position'] = function(zoomLevel) {
    
    // Alias the slider stack
    var sliderStack = _slider.stack;

    // Step through the stack
    for (var i=0, l=sliderStack.length; i< l; i++ ) {
      
      // Pass the zoomLevel value to each slider and update the Thumb's position
      sliderStack[i].setThumbPositionFromZoomLevel(zoomLevel);
    
    }

  };



  // #### SLIDER CLASS #############################################################################

  SliderClass = function (props, _slider) {

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
    
    // Initialize this new Slider instance
    this.init();

    // Add this instance to a stack of sliders
    _slider.stack.push(this);

  };



  SliderClass.prototype = {

    // Settings

    // Number of milliseconds to wait before updating zoom when mouse is held down over a letter
    letterZoomDelay: 100,
    // NOTE: Magic number 768 is default original width of SVG document
    originalWidth: 768,
    // Half the width of the SVG thumb element at it's original size
    originalThumbWidth: 24,
    
    // TODO: Make the color settings object configurable on instantiation using deep object merge

    // Color settings object
    color: {
      letterSmlBack     : { normal: "rgba(0,0,0,0)", hover: "rgba(100,100,100,0.5)", active: "rgba(50,50,50,0)" },
      trackBack         : { normal: "rgba(0,0,0,0)", hover: "rgba(100,100,100,0.5)", active: "rgba(50,50,50,0)" },
      letterBigBack     : { normal: "rgba(0,0,0,0)", hover: "rgba(100,100,100,0.5)", active: "rgba(50,50,50,0)" },
      letterSml         : { normal: "#FFFFFF", hover: "#FFFF00", active: "#FF0000" },
      track             : { normal: "#0045AD", hover: "#0067CF", active: "#0089EF" },
      thumb             : { normal: "#FFFFFF", hover: "#FFFF00", active: "#FF0000" },
      letterBig         : { normal: "#FFFFFF", hover: "#FFFF00", active: "#FF0000" },
    },

    // The default width & height dimensions are overwritten with the DOM containers's dimensions
    width: 768,
    height: 128,



    // Initialize the slider vars and call draw
    init: function (props) {
      this.create();
      this.setdimensions();
      this.bindevents();
    },

    buildsvg: function (slider, color) {

      return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+

        'width="'+slider.width+'" height="'+slider.height+'" viewBox="0, 0, 768, 128" preserveAspectRatio="none">' +

        '<path class="letterSmlBack"  fill="'+color.letterSmlBack.normal+'"   d="M0,0 L128,0 L128,128 L0,128 z" />' +
        '<path class="trackBack"      fill="'+color.trackBack.normal+'"       d="M128,0 L640,0 L640,128 L128,128 z" />' +
        '<path class="letterBigBack"  fill="'+color.letterBigBack.normal+'"   d="M640,0 L768,0 L768,128 L640,128 z" />' +

        '<path class="letterSml"      fill="'+color.letterBig.normal+'"       d="M76.377,108.115 L51.034,108.115 L47.547,120 L24.808,120 L51.869,48 L76.131,48 L103.192,120 L79.913,120 z M71.711,92.546 L63.754,66.663 L55.847,92.546 z" />' +
        '<path class="track"          fill="'+color.track.normal+'"           d="M152,88 L616,21.7 L616,104 L152,104 z" />' +
        '<path class="thumb"          fill="'+color.thumb.normal+'"           d="M-24,96 L-24,16 L24,16 L24,96 L0,120 z" />' +    
        '<path class="letterBig"      fill="'+color.letterSml.normal+'"       d="M721.877,102.832 L685.271,102.832 L680.235,120 L647.389,120 L686.477,16 L721.522,16 L760.611,120 L726.985,120 z M715.138,80.344 L703.645,42.958 L692.224,80.344 z" />' +  
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

      // Switch draggable ghost off
      this.$container.css({
        '-webkit-user-select' : 'none',
        '-khtml-user-select'  : 'none',
        '-moz-user-select'    : 'none',
        '-o-user-select'      : 'none',
        'user-select'         : 'none'
      });

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
      // TODO: remove these if they end up not being used...
      // svg.viewBox   .on('mouseenter', context...
      // svg.viewBox   .on('mouseleave', context...

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

      // TODO: Add this back in when Toolbar resize feature is finished
      // sitecues.on("toolbar/resized", function (toolbar) {
      //   slider.repaint(toolbar);
      // });

    },



    // When the mouse is is pressed over the Track, Thumb and TrackBack
    mousedowntrack: function (e) {

      // Get the context when called from event mousemove event listener
      var slider = e.data.slider;

      // Store the state of the mousedown
      slider.mouseDownTrack = true;

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

      // Reset element bounds incase dom sizes change
      slider.setcontainerbounds.call(slider);
      slider.setsvgbounds.call(slider);

      // Get the aspect horizontal aspect ratio of the Slider
      slider.aspect = slider.originalWidth/slider.width; 

      // Get the half width of the thumb relative to the Slider's scale
      var thumbHalfWidth = (slider.originalThumbWidth/2)/slider.aspect;

      // Get the left position of the Slider in the Document
      slider.offsetLeft = slider.svg.viewBox.get(0).getBoundingClientRect().left
      
      // Get the Left & Right edges of the Slider Track's bounding box ('back')
      slider.trackBackLeft = slider.svg.trackBack.get(0).getBoundingClientRect().left - slider.offsetLeft;
      var trackBackRight = slider.trackBackLeft + slider.svg.trackBack.get(0).getBoundingClientRect().width;

      // Set the bounds of the Thumb relative to the Thumb's width
      slider.thumbBoundLeft = this.trackBackLeft + thumbHalfWidth;
      slider.thumbBoundRight = trackBackRight - thumbHalfWidth;

      // Set the width of the TrackBack
      slider.thumbBoundsWidth = slider.thumbBoundRight - slider.thumbBoundLeft;

      slider.trackBackWidth = trackBackRight -  slider.trackBackLeft;

      // Update the Thumb element's position based on the zoom level now dimensions have changed
      conf.get('zoom', function (zoomLevel) {
        slider.setThumbPositionFromZoomLevel.call(slider, zoomLevel);
        slider.translateThumbSVG.call(slider);
      });

    },



    // Update the position of the Thumb
    dragthumb: function (e) {

      // Get the context when called from event mousemove event listener
      var slider = e.data.slider;
      
      // If the slider has put the mouse-down inside the Slider Track Back bounds...
      if (slider.mouseDownTrack) {
        
        // Get the postition of the mouse relative to the Slider
        slider.thumbPos = e.clientX - slider.offsetLeft + $(document).scrollLeft();

        // Contain the Thumb position in the Track bounds
        if (slider.thumbPos < slider.thumbBoundLeft) {
          slider.thumbPos = slider.thumbBoundLeft;
        }
        if (slider.thumbPos > slider.thumbBoundRight) {
          slider.thumbPos = slider.thumbBoundRight;
        }

        // Update the Zoom Level
        slider.updatezoomlevel.call(slider);
  
        // NOTE: Switched off because this makes the thumb appear jerky when dragged.
        // This is because the conf gets updated, which then emits events to subscribers, which in
        // turn updates the thumb position to the zoom.step value. So you drag in decrete increments
        // less-than zoom.step, ie: you drag the Thumb less than one pixel, but then the
        // emit(toolbar/slider/update-positionslider) then moves the Thumb to the zoom.step of 0.1
        // which happens to be bigger than a pixel. Uncomment the next line of code to see.
        
        // Translate the Thumb SVG element (slide the thumb)
        //slider.translateThumbSVG.call(slider);

      }

    },



    // Updates the sitecues zoom-level based on the Thumb position
    updatezoomlevel: function () {

      // Calculate the zoom range (I think we should put this in zoom.js) - Al
      var zoomRange = zoom.max-zoom.min
      
      // FIXME: -(1/this.aspect) .... Not entirely happy with this calculation. It is not exact.
      // Possibly something to do with margins/borders etc?
      ,   zoomLevel = ((zoomRange/this.thumbBoundsWidth) * (this.thumbPos)) - (1/this.aspect);
      ;

      conf.set('zoom', zoomLevel);
      //console.log( zoomLevel);

    },

    // Set the Slider's internal thumb position variable based on the zoom level
    setThumbPositionFromZoomLevel: function (zoomLevel){
      this.thumbPos = (this.trackBackWidth / (zoom.max-zoom.min) * (zoomLevel-zoom.min)) + this.thumbBoundLeft;
    },

    // Move the SVG thumb element based on the dimensions of the Slider
    translateThumbSVG: function () {
      this.svg.thumb.attr('transform', 'translate('+ (this.thumbPos * this.aspect) +')');
    },



    destroy: function () {
    }

  }; // END: SliderClass.prototype
  


  // Core callback
  callback();

})  // END: use
}); // END: def