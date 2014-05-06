/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
sitecues.def('background-dimmer', function (backgroundDimmer, callback, log) {

  'use strict';

  // Get dependencies
  sitecues.use('jquery', 'conf', 'util/positioning', 'platform', function ($, conf, positioning, platform) {

    $.extend( backgroundDimmer, {
        kDimmerId       : 'sitecues-eq360-bgxxxxxxxxxx1'
      , kDimmingColor   : '#000000'
      , kDimmingOpacity : 0.65
      , kDimmingSpeed   : 150
      }
    );

    var wrapper;

    // Dims stuff. Word. ///////////////////////////////////////////////////////
    backgroundDimmer.dimBackgroundContent = function (hlbNode) {

      ////  Set the coordinates for the SVG Dimmer overlay

      // Define the coordinates of the whole document to be dimmed out
      var viewport    = positioning.getViewportDimensions(0)
        , zIndex      = 2147483646
        , offsetTop   = viewport.top //window.pageYOffset
        , offsetLeft  = viewport.left //window.pageXOffset
        , svgPath     = getSVGPath(viewport, hlbNode)
        , inner       = svgPath.inner
        , dimmerSVG
        ;
      if (platform.browser.isIE) {
        offsetLeft = 0;
        offsetTop  = 0;
      }
      wrapper = svgPath.wrapper;

      // Create dimmer SVG overlay
      dimmerSVG = '<svg width="' + viewport.width + 'px' +'" height="' + viewport.height + 'px' + '" xmlns="http://www.w3.org/2000/svg">' +

          // Use an SVG path to create the dimmer area
          '<path '+

            // Set style attributes for the SVG polygon
            'fill      = "' + this.kDimmingColor    + '" '+
            'opacity   = "' + this.kDimmingOpacity  + '"' +
            'fill-rule = "evenodd " '+
            'd="' + wrapper + ' ' + inner + ' ' +

          // Close the path
          ' Z" />' +

          // Close the SVG
          '</svg>';



      if(platform.browser.isIE) {
        // This is specifically a problem with IE9, other versions are TBD
        zIndex = 2147483643;
      }

      // Create the container for the SVG dimmer
      this.$dimmerContainer = $('<div/>', {

        // Set the ID of the dimmer contain
        id: this.kDimmerId,

        // Add the SVG path to the HTML of the dimmerContainer
        html: dimmerSVG

      })

      // Set the CSS for the dimmerContainer
      .style({
        'position'      : 'fixed',
        'display'       : 'block',
        'z-index'       : zIndex,
        'opacity'       : 0,
        'left'          : offsetLeft   + 'px',
        'top'           : offsetTop    + 'px',
        'width'         : viewport.width  + 'px',
        'height'        : viewport.height + 'px',
        'overflow'      : 'visible',
        'pointer-events': 'none'
      }, '', '')
      .effects({
          opacity : 1
        },
        150
      );

      $('html').append( this.$dimmerContainer );

    };

    backgroundDimmer.updateBackgroundPath = function (svgPath) {
      this.$dimmerContainer.find('svg path').attr('d', svgPath);
    };

    // Un-dims stuff. Ballin' //////////////////////////////////////////////////
    backgroundDimmer.removeDimmer = function () {
      if (!this.$dimmerContainer) {
          return;
      }

      // Animate out the dimmerContainer
      this.$dimmerContainer.style({opacity: 0}, '', 'important');

      // Remove the dimmerContainer after the animation has finished
      this.$dimmerContainer.remove();
    };

    /*
     * Set the coordinates for the SVG Dimmer overlay.
     */
    function getSVGPath (viewport, hlbNode) {
        
      // Define the coordinates of the element being highlighted
      // [ highlight-box.js/itemNode ]
      var elem = positioning.getBoundingBox(hlbNode)

        // Wind clockwise path around whole document.
        , wrapper = getWrapperDimensions(viewport)

        // Wind clockwise relative path around element.
        , inner = getInnerDimensions(elem, $(hlbNode))

        ;
      
      return {'wrapper': wrapper, 'inner': inner};      

    }

    function getWrapperDimensions(viewport) {
      
      // Wind clockwise path around whole document.
      var wrapper =  
      'M'+ 0                +' '+ 0                 +' '+
      'L'+ viewport.width   +' '+ 0                 +' '+
      'L'+ viewport.width   +' '+ viewport.height   +' '+
      'L'+ 0                +' '+ viewport.height;

      return wrapper;
    }
    
    function getInnerDimensions (elem, $hlbNode) {
      // Wind clockwise path around whole document.

      var zoom        = conf.get('zoom')
        , offsetLeft  = $hlbNode.offset().left/zoom
        , offsetTop   = $hlbNode.offset().top
        , pageXOffset = window.pageXOffset
        , pageYOffset = window.pageYOffset
        , inner
        ;


        offsetLeft  -= pageXOffset/zoom;
        offsetTop   -= pageYOffset;


      inner = 'M'+ (offsetLeft + 2)  +' '+ (offsetTop/zoom + 2)   +' '+
                  'l'+ (elem.width/zoom - 4)  +' '+ 0                 +' '+
                  'l'+ 0                 +' '+ (elem.height/zoom - 4) +' '+
                  'l'+ (-elem.width/zoom + 4) +' '+ 0;

      return inner;
    
    }

    /**
     * Re-scale bg dimmer vieport and hole coordinates.
     * @param hlb Object
     */
    function onZoomChange (hlb) {

      var zoom = conf.get('zoom')
        
        // Define the coordinates of the whole document to be dimmed out
        , viewport = positioning.getViewportDimensions(0, zoom)
        , svgPath = getSVGPath(viewport, hlb)
        , offsetTop = viewport.top
        , offsetLeft = viewport.left
        ;    
      
      backgroundDimmer.$dimmerContainer.style({
        'width'  : viewport.width  + 'px',
        'height' : viewport.height + 'px',
        'top'    : offsetTop       + 'px',
        'left'   : offsetLeft      + 'px'
      }, '', 'important');
    //  console.log(svgPath.wrapper + '---' + svgPath.inner)
      backgroundDimmer.updateBackgroundPath(svgPath.wrapper + '' + svgPath.inner);
    }
    
    sitecues.on('hlb/ready', function(hlb) {
      
      // Add a listener on zoom change event. We need to re-scale bg dimmer vieport and hole coordinates.
      sitecues.on('zoom zoom/increase zoom/decrease', function() {
        // Update SVG path to remove inner path responsible for hole.
        onZoomChange(hlb);
      });

    });
    
    sitecues.on('hlb/deflating', function(hlb) {
      
      // Remove the zoom event handler for background dimmer.
      sitecues.off('zoom zoom/increase zoom/decrease', function() {
        onZoomChange(hlb);
      });

      // Remove the inner path so that hole will not be visible.
      backgroundDimmer.updateBackgroundPath(wrapper);
    
    });
    
    // Done
    callback();

  });

});