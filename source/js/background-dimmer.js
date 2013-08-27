/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
sitecues.def('background-dimmer', function (backgroundDimmer, callback, log) {

  // Get dependencies
  sitecues.use('jquery', 'conf', 'util/positioning', 'browser', function ($, conf, positioning, browser) {

    $.extend( backgroundDimmer, {
        kDimmerId       : 'sitecues-eq360-bgxxxxxxxxxx1'
      , kDimmingColor   : '#000000'
      , kDimmingOpacity : 0.65
      , kDimmingSpeed   : 150
    });

    var wrapper;
    // Dims stuff. Word. ///////////////////////////////////////////////////////
    backgroundDimmer.dimBackgroundContent = function (hlbNode, zoom) {

        ////  Set the coordinates for the SVG Dimmer overlay

        // Define the coordinates of the whole document to be dimmed out
        var viewport = positioning.getViewportDimensions(0, zoom);

        var svgPath = getSVGPath(viewport, hlbNode);
        var inner   = svgPath.inner;
        wrapper     = svgPath.wrapper;

        // Create dimmer SVG overlay
        // Make sure to set height and width of SVG https://bugzilla.mozilla.org/show_bug.cgi?id=382325
        var dimmerSVG ='<svg style="height:' + viewport.height + 'px;width:' + viewport.width +'px" xmlns="http://www.w3.org/2000/svg">' +

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

        // Create the container for the SVG dimmer
        this.$dimmerContainer = $('<div/>', {

        // Set the ID of the dimmer contain
        id: this.kDimmerId,

        // Add the SVG path to the HTML of the dimmerContain
        html: dimmerSVG })

        // Set the CSS for the dimemrContainer
        .style({
          'display'       : 'block',
          'z-index'       : 2147483646,
          'opacity'       : 0,
          'width'         : viewport.width +'px',
          'height'        : viewport.height +'px',
          'overflow'      : 'visible',
          'pointer-events': 'none',
          'transition'    : 'opacity 150ms ease-out'
        }, '', 'important');

        if(browser.isFirefox()) {
          this.$dimmerContainer.style({
            'position'      : 'absolute',
            'left'          : window.pageXOffset/conf.get('zoom') + 'px',
            'top'           : window.pageYOffset/conf.get('zoom') + 'px'
          }, '', 'important');
        } else {
          this.$dimmerContainer.style({
            'position'      : 'fixed',
            'left'          : '0px',
            'top'           : '0px',
          }, '', 'important');
        }

        $('body').append( this.$dimmerContainer );
        // Animate the dimmer background container
        this.$dimmerContainer.style({ opacity: 1 }, '', 'important');
    };

    backgroundDimmer.updateBackgroundPath = function(svgPath) {
        this.$dimmerContainer.find('svg path').attr('d', svgPath);
    }

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
    function getSVGPath(viewport, hlbNode) {
        // Define the coordinates of the element being highlighted
        // [ highlight-box.js/itemNode ]
        var elem = positioning.getBoundingBox(hlbNode);

        // Wind clockwise path around whole document.
        var wrapper = getWrapperDimensions(viewport);

        // Wind clockwise relative path around element.
        var inner = getInnerDimensions(elem, $(hlbNode));
        
        return {'wrapper': wrapper, 'inner': inner};      
    }

    function getWrapperDimensions(viewport) {
      var topLeft = {x: 0, y: 0},
        topRight = {x: viewport.width, y: 0},
        bottomLeft = {x: 0, y: viewport.height}, 
        bottomRight = {x: viewport.width, y: viewport.height};

      // Wind clockwise path around whole document.
      var wrapper = 
        'M'+ topLeft.x +' '+ topLeft.y + ' ' +
        'L'+ topRight.x +' '+ topRight.y + ' ' +
        'L'+ bottomRight.x +' '+ bottomRight.y + ' ' +
        'L'+ bottomLeft.x +' '+ bottomLeft.y;

      return wrapper;
    }
    
    function getInnerDimensions(elem, $hlbNode) {
        // Wind clockwise path around whole document.
        if(browser.isFirefox()) {
          var inner =  
            'M'+ ($hlbNode.offset().left - window.pageXOffset + 2)/conf.get('zoom') +' '+ ($hlbNode.offset().top - window.pageYOffset + 2)/conf.get('zoom')  +' '+
            'l'+ (elem.width - 4)/conf.get('zoom')  +' '+ 0                   +' '+
            'l'+ 0                 +' '+ (elem.height - 4)/conf.get('zoom')   +' '+
            'l'+ (-(elem.width - 4))/conf.get('zoom') +' '+ 0;
          return inner;
        } else {
          var inner =  
            'M'+ ($hlbNode.offset().left - window.pageXOffset + 2) +' '+  ($hlbNode.offset().top - window.pageYOffset + 2)  +' '+
            'l'+ (elem.width - 4)  +' '+ 0                   +' '+
            'l'+ 0                 +' '+ (elem.height - 4)   +' '+
            'l'+ (-elem.width + 4) +' '+ 0;
          return inner;
        }
    }

    /**
     * Re-scale bg dimmer vieport and hole coordinates.
     * @param hlb Object
     */
    function onZoomChange(hlb) {
        var zoom = conf.get('zoom');
        // Define the coordinates of the whole document to be dimmed out
        var viewport = positioning.getViewportDimensions(0, zoom, true);
        var svgPath = getSVGPath(viewport, hlb);

        backgroundDimmer.$dimmerContainer.style({width: viewport.width + 'px',
            height: viewport.height +'px',
            top: viewport.top + 'px',
            left: viewport.left + 'px'
        }, '', 'important');
        backgroundDimmer.updateBackgroundPath(svgPath.wrapper + '' + svgPath.inner);
    }
    
    sitecues.on('hlb/ready', function(hlb) {
        // Add a listener on zoom change event. We need to re-scale bg dimmer vieport and hole coordinates.
        sitecues.on('zoom zoom/increase zoom/decrease', function() {
            // Update SVG path to remove inner path responsible for hole.
            onZoomChange(hlb);
        })
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