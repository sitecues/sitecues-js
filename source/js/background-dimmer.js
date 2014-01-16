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
    backgroundDimmer.dimBackgroundContent = function (hlbNode, zoom) {

      ////  Set the coordinates for the SVG Dimmer overlay

      // Define the coordinates of the whole document to be dimmed out
      var viewport    = positioning.getViewportDimensions(0, zoom)
        , zIndex      = 2147483646
        , offsetTop   = viewport.top / zoom
        , offsetLeft  = viewport.left / zoom
        , svgPath     = getSVGPath(viewport, hlbNode)
        , inner       = svgPath.inner
        , dimmerSVG
        ;

      wrapper = svgPath.wrapper;

      // Create dimmer SVG overlay
      dimmerSVG = '<svg width="' + viewport.width/zoom + 'px' +'" height="' + viewport.height/zoom + 'px' + '" xmlns="http://www.w3.org/2000/svg">' +

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
        'left'          : offsetLeft   + 'px', //EQ-880
        'top'           : offsetTop    + 'px', //EQ-880
        'width'         : viewport.width/zoom  + 'px',
        'height'        : viewport.height/zoom + 'px',
        'overflow'      : 'visible',
        'pointer-events': 'none',
        'transition'    : 'opacity 150ms ease-out'
      }, '', 'important');

      $('body').append( this.$dimmerContainer );
      
      // Animate the dimmer background container
      this.$dimmerContainer.style({ opacity: 1 }, '', 'important');

      //TODO - Necessary to get pixel perfect in FF EQ-880
      if (!('zoom' in document.createElement('div').style)) {
        onZoomChange(hlbNode);
      }

    };

    backgroundDimmer.updateBackgroundPath = function (svgPath) {
      this.$dimmerContainer.find('svg path').attr('d', svgPath);
    };

    // Un-dims stuff. Ballin' //////////////////////////////////////////////////
    backgroundDimmer.removeDimmer = function () {
      
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
      /* EQ-880
      $hlbNode.offset().left - window.pageXOffset + 2) +' '+ ($hlbNode.offset().top - window.pageYOffset + 2)
      RETURNS SLIGHTLY DIFFERENT...and only when zoom is lvl 1! ugh.
      */
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
        
        //EQ-880
        , svgPath = getSVGPath(viewport, hlb)
        , offsetTop = viewport.top/zoom
        , offsetLeft = viewport.left/zoom
        ;    
      
      backgroundDimmer.$dimmerContainer.style({
        'width'  : viewport.width/zoom  + 'px',
        'height' : viewport.height/zoom + 'px',
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