﻿/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
sitecues.def('background-dimmer', function (backgroundDimmer, callback) {

  // Get dependencies
  sitecues.use('jquery', 'util/positioning', function ($, positioning) {

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

		// Define the coordinates of the element being highlighted
		// [ highlight-box.js/itemNode ]
		var elem = positioning.getBoundingBox(hlbNode);

        // Wind clockwise path around whole document.
        wrapper =  
        'M'+ 0                +' '+ 0                 +' '+
        'L'+ viewport.width   +' '+ 0                 +' '+
        'L'+ viewport.width   +' '+ viewport.height   +' '+
        'L'+ 0                +' '+ viewport.height;
 
        // Wind clockwise relative path around element.
        var inner = 
        'M'+ ($(hlbNode).offset().left - window.pageXOffset + 2) +' '+ ($(hlbNode).offset().top - window.pageYOffset + 2)  +' '+
        'l'+ (elem.width - 4)  +' '+ 0                   +' '+
        'l'+ 0                 +' '+ (elem.height - 4)   +' '+
        'l'+ (-elem.width + 4) +' '+ 0;

      // Create dimmer SVG overlay
      var dimmerSVG ='<svg xmlns="http://www.w3.org/2000/svg">' +

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
        html: dimmerSVG})
        // Set the CSS for the dimemrContainer
        .style({
            position      : 'absolute'
          , display       : 'block'
          , zIndex        : 9999999999
          , opacity       : 0
          , left          : viewport.left
          , top           : viewport.top
          , width         : viewport.width
          , height        : viewport.height
          , overflow      : 'visible'
          , pointerEvents : 'none'
        }, '', 'important');

     $('body').append( this.$dimmerContainer );
      // Animate the dimmer background container
      this.$dimmerContainer.animate({ opacity: 1 }, this.kDimmingSpeed);
    };



    // Un-dims stuff. Ballin' //////////////////////////////////////////////////
    backgroundDimmer.removeDimmer = function () {
      // Update SVG path to remove inner path responsible for hole.
      this.$dimmerContainer.find('svg path').attr('d', wrapper);
      // Animate out the dimmerContainer
      this.$dimmerContainer.animate({ opacity: 0 }, this.kDimmingSpeed, function () {
        
        // Remove the dimmerContainer after the animation has finished
        backgroundDimmer.$dimmerContainer.remove();
      });
    };

    
    // Done
    callback();
  });
});