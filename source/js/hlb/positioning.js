/**
 * HLB Positioning is responsible for positioning the HLB so that the HLB and the original element's midpoints
 * overlap or the HLB is as close to the original element while being encapsulated within the HLB_SAFE_AREA.
 * It is also responsible for calculating and setting the appropriate height/width of the HLB so that it is
 * encapsulated within the HLB_SAFE_AREA.
 */
sitecues.def('hlb/positioning', function(hlbPositioning, callback) {

  'use strict';

  sitecues.use('jquery', 'conf', 'hlb/styling', 'util/common', 'hlb/safe-area',
  function($, conf, hlbStyling, common, hlbSafeArea) {

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

    var VALID_ELEMENTS_FOR_CONSTRAINED_WIDTH = 'p,h1,h2,h3,h4,h5,h6';

    //////////////////////////////
    // PRIVATE FUNCTIONS
    /////////////////////////////

    /**
     * [isEligibleForConstrainedWidth determines if the HLB is eligible for limiting its width to 50 characters]
     * @param  {[jQuery element]} $hlbElement [HLB element]
     * @return {[Boolean]}     [if true, limit the width]
     */
    function isEligibleForConstrainedWidth($hlbElement) {

      return $hlbElement.is(VALID_ELEMENTS_FOR_CONSTRAINED_WIDTH);

    }

    /**
     * [getExtraLeftPadding returns addition left-padding of the HLB]
     * @param  {[jQuery element]} $hlbElement [HLB element]
     * @return {[integer]}                    [The additional left-padding]
     */
    function getExtraLeftPadding($hlbElement) {
      return parseInt($hlbElement.css('paddingLeft')) - hlbStyling.defaultPadding;
    }

    //////////////////////////
    // PUBLIC FUNCTIONS
    //////////////////////////

    /**
     * [midPointDiff computes the distance between the midpoints of 2 elements]
     * @param  {[jQuery element]} $rectOne [jQuery element]
     * @param  {[jQuery element]} $rectTwo [jQuery element]
     * @return {[object]}         [x and y difference between the 2 midpoints]
     */
    hlbPositioning.midPointDiff = function($rectOne, $rectTwo) {

      var br1 = $rectOne instanceof $ ? $rectOne[0].getBoundingClientRect() : $rectOne,
          br2 = $rectTwo instanceof $ ? $rectTwo[0].getBoundingClientRect() : $rectTwo,
          br1x = br1.left + br1.width / 2,
          br1y = br1.top + br1.height / 2,
          br2x = br2.left + br2.width / 2,
          br2y = br2.top + br2.height / 2;

      return {
        'x': br1x - br2x,
        'y': br1y - br2y
      };

    };

    /**
     * [limitWidth limits the width of the HLB to X characters, if eligible]
     * @param  {[jQuery element]} $originalElement    [original element]
     * @param  {[jQuery element]} $hlbElement         [HLB element]
     * @param  {[Integer]}        characterWidthLimit [number of characters the HLB is restricted to horizontally]
     */
    hlbPositioning.limitWidth = function($originalElement, $hlbElement, characterWidthLimit) {

      // If the HLB is eligible for limiting the width to
      // characterWidthLimit characters...such as VALID_ELEMENTS_FOR_CONSTRAINED_WIDTH
      if (isEligibleForConstrainedWidth($hlbElement)) {

        // 'ch' units are equal to the width of the "0" character
        $hlbElement.css({
          'max-width': characterWidthLimit + 'ch'
        });

        // Setting the width requires checking if content does not overflow horizontally
        hlbPositioning.fixOverflowWidth($hlbElement);
      }

    };

    /**
     * [mitigateVerticalScroll increases the height of the HLB to fit its content.]
     * @param  {[jQuery element]} $hlbElement [HLB]
     */
    hlbPositioning.mitigateVerticalScroll = function($hlbElement) {

      // If the HLB has a vertical scrollbar and has a height less than the safe zone height
      if (common.hasVertScroll($hlbElement[0]) &&
        hlbPositioning.scaleRectFromCenter($hlbElement).height < hlbSafeArea.getSafeZoneBoundingBox().height) {

        // Set to the scroll height minus 4 (half of the padding)
        // It is necessary to subtract the padding because scrollHeight includes padding.
        $hlbElement.css({
          'height': $hlbElement[0].scrollHeight - parseInt($hlbElement.css('paddingBottom')) + 'px'
        });

        // Now that we have set the height of the cloned element to the height of the scroll height...
        // we need to test that the element's height does not exceed the height of the safe area.
        hlbPositioning.constrainHeightToSafeArea($hlbElement);
      }

    };

    /**
     * [constrainPosition computes the distance between a rectangle and the
     * minimum distance it must travel to occupy another rectangle]
     * @param  {[DOM element]} element   [any element of a DOM]
     * @param  {[object]}      container [the bounding rect]
     * @return {[object]}                [x and y difference]
     */
    hlbPositioning.constrainPosition = function(element) {

      var offset = {
            'x': 0,
            'y': 0
          },

          container = hlbSafeArea.getSafeZoneBoundingBox();

      if (element.left < container.left) {
        offset.x -= container.left - element.left;
      }
      if (element.top < container.top) {
        offset.y -= container.top - element.top;
      }
      if (element.left + element.width > container.right) {
        offset.x += (element.left + element.width) - container.right;
      }
      if (element.top + element.height > container.bottom) {
        offset.y += (element.top + element.height) - container.bottom;
      }
      return offset;
    };

    /**
     * [constrainHeightToSafeArea constrains the height of the HLB to the safe area.
     * If HLB is an image, then it keeps the aspect ratio.]
     * @param  {[jQuery element]} $hlbElement [HLB element]
     */
    hlbPositioning.constrainHeightToSafeArea = function($hlbElement) {
      var originalHeight = hlbPositioning.scaleRectFromCenter($hlbElement).height,
          safeZoneHeight = hlbSafeArea.getSafeZoneBoundingBox().height;

      // Would the scaled element's height be greater than the safe area height?
      if (originalHeight > safeZoneHeight) {

        // height is now the "safe zone" height, minus the padding/border
        $hlbElement.css({
          'height': ((safeZoneHeight / hlbSafeArea.getHLBTransformScale()) -
                     (hlbStyling.defaultBorder +
                      hlbStyling.defaultBorder +
                      parseInt($hlbElement.css('paddingTop')) +
                      parseInt($hlbElement.css('paddingBottom'))
                     )
                    ) + 'px'
        });

        // Keep aspect ratio if HLB is an image
        if (common.isVisualMedia($hlbElement)) {

          // We need to recalculate the bounding client rect of the HLB element, because we just changed it.
          $hlbElement.css({
            'width': ($hlbElement[0].getBoundingClientRect().width *
                (safeZoneHeight / originalHeight)) + 'px'
          });

        }
      }
    };

    /**
     * [constrainWidthToSafeArea constrains the width of the HLB to the safe area.
     * If HLB is an image, then it keeps the aspect ratio.]
     * @param  {[jQuery element]} $hlbElement [HLB element]
     */
    hlbPositioning.constrainWidthToSafeArea = function($hlbElement) {

      var originalWidth = hlbPositioning.scaleRectFromCenter($hlbElement).width,
          safeZoneWidth = hlbSafeArea.getSafeZoneBoundingBox().width;

      // Would the scaled element's width be greater than the safe area width?
      if (originalWidth > safeZoneWidth) {

        // width is now the "safe zone" width, minus the padding/border
        $hlbElement.css({
          'width': ((safeZoneWidth / hlbSafeArea.getHLBTransformScale()) -
              (hlbStyling.defaultBorder + hlbStyling.defaultPadding + getExtraLeftPadding($hlbElement) / 2) * 2) + 'px'
        });

        // Keep aspect ratio if HLB is an image
        if (common.isVisualMedia($hlbElement)) {

          // We need to recalculate the bounding client rect of the HLB element, because we just changed it.
          $hlbElement.css({
            'height': ($hlbElement[0].getBoundingClientRect().height *
                (safeZoneWidth / originalWidth)) + 'px'
          });

        }
      }
    };

    /**
     * [scaleRectFromCenter helper function for calculating a bounding box if an element were to be scaled from 50%50%]
     * @param  {[jQuery element]} $hlbElement [HLB]
     * @return {[object]}                     [A simulated bounding client rect]
     */
    hlbPositioning.scaleRectFromCenter = function($hlbElement) {

      var clonedNodeBoundingBox = $hlbElement[0].getBoundingClientRect(),
        zoomFactor = hlbSafeArea.getHLBTransformScale();

      // The bounding box of the cloned element if we were to scale it
      return {
        'left'  : clonedNodeBoundingBox.left   - ((clonedNodeBoundingBox.width  * hlbSafeArea.HLBZoom - clonedNodeBoundingBox.width)  / 2),
        'top'   : clonedNodeBoundingBox.top    - ((clonedNodeBoundingBox.height * hlbSafeArea.HLBZoom - clonedNodeBoundingBox.height) / 2),
        'width' : clonedNodeBoundingBox.width  * hlbSafeArea.HLBZoom,
        'height': clonedNodeBoundingBox.height * hlbSafeArea.HLBZoom
      };
    };

    /**
     * [addVerticalScroll Adds a vertical scrollbar, if necessary, and corrects any
     *  dimension/positioning problems resulting from adding the scrollbar]
     * @param {[jQuery element]} $hlbElement [HLB element]
     */
    hlbPositioning.addVerticalScroll = function($hlbElement) {

      if (common.hasVertScroll($hlbElement[0])) {

        $hlbElement.css({
          'overflow-y': 'scroll'
        });

        // Adding a vertical scroll may sometimes make content overflow the width
        hlbPositioning.fixOverflowWidth($hlbElement);

      }

    };

    /**
     * [initializeSize sets the height and width of the HLB to the orignal elements bounding
     * box height and width.  Useful for images.]
     * @param  {[jQuery element]} $hlbElement      [The HLB]
     * @param  {[Object]} $initialHLBRect [The highlight rect or the $originalElement  bounding client rect.]
     */
    hlbPositioning.initializeSize = function($hlbElement, initialHLBRect) {

      var zoom = conf.get('zoom');

      $hlbElement.css({
        'width' : (initialHLBRect.width  / zoom) + 'px', //Preserve dimensional ratio
        'height': (initialHLBRect.height / zoom) + 'px', //Preserve dimensional ratio
      });

    };

    /**
     * [fixOverflowWidth sets the width of the HLB to avoid horizontal scrollbars]
     * @param  {[jQuery element]} clonedNode [HLB]
     */
    hlbPositioning.fixOverflowWidth = function($hlbElement) {

      var hlbElement = $hlbElement[0];

      // If there is a horizontal scroll bar
      if (hlbElement.clientWidth < hlbElement.scrollWidth) {

        $hlbElement.css({
          'width': $hlbElement.width() + (hlbElement.scrollWidth - hlbElement.clientWidth) + hlbStyling.defaultPadding + 'px'
        });

        // Again, we can't be positive that the increase in width does not overflow the safe area.
        hlbPositioning.constrainWidthToSafeArea($hlbElement);
      }
    };

    if (SC_UNIT) {
      exports.isEligibleForConstrainedWidth = isEligibleForConstrainedWidth;
      exports.fixOverflowWidth              = hlbPositioning.fixOverflowWidth;
      exports.getExtraLeftPadding           = getExtraLeftPadding;
      exports.midPointDiff                  = hlbPositioning.midPointDiff;
      exports.limitWidth                    = hlbPositioning.limitWidth;
      exports.mitigateVerticalScroll        = hlbPositioning.mitigateVerticalScroll;
      exports.constrainPosition             = hlbPositioning.constrainPosition;
      exports.constrainHeightToSafeArea     = hlbPositioning.constrainHeightToSafeArea;
      exports.constrainWidthToSafeArea      = hlbPositioning.constrainWidthToSafeArea;
      exports.scaleRectFromCenter           = hlbPositioning.scaleRectFromCenter;
      exports.addVerticalScroll             = hlbPositioning.addVerticalScroll;
      exports.initializeSize                = hlbPositioning.initializeSize;
      exports.hlbPositioning                = hlbPositioning;
    }

    callback();

  });

});
