/**
 * This file contains auxilary functions for prepare-and-adjust HLB instance.
 */
sitecues.def('hlb/style', function (hlbStyle, callback, log) {

      hlbStyle.kBoxZindex        = 2147483644;
      hlbStyle.kBoxNoOutline     = '0px solid transparent';
      hlbStyle.kBoxPadding       = 4;  // Give the text a little extra room
      hlbStyle.kBoxBorderRadius  = 4;
      hlbStyle.kBoxBorderStyle   = 'solid';
      hlbStyle.kBoxBorderColor   = '#222222';
      hlbStyle.kDefaultBgColor   = '#ffffff';
      hlbStyle.kBoxBorderWidth   = 3;
      hlbStyle.kDefaultBgColor   = 'rgb(255, 255, 255)';
      hlbStyle.kDefaultTextColor = 'rgb(0, 0, 0)';
      
    // Get dependencies
    sitecues.use('jquery', 'hlb/designer', 'ui', function ($, designer) {

      /*
       * Calculate CSS styles to set before inflation animation.
       * @param currentStyle Object
       * @param cssUpdate Object
       * @return Object
       */
      // todo: cut the expanded height value!
      hlbStyle.getCssBeforeAnimateStyles = function(hlb, currentStyle, cssUpdate) {
        // todo: for floated elements we can use positioning.getCenter():absRect
        var newHeight, newWidth, newOverflowY, newTop, newLeft,maxHeight, compensateShift;
        compensateShift = hlb.compensateShift;
        newHeight = cssUpdate.height? cssUpdate.height: hlb.computedStyles.height;
        newWidth = cssUpdate.width ? cssUpdate.width + 'px': currentStyle.width;
        newOverflowY = currentStyle.overflow || currentStyle['overflow-y'] ? currentStyle.overflow || currentStyle['overflow-y'] : 'auto';
        newTop = designer.getHeightExpandedDiffValue()? (cssUpdate.top || 0) + designer.getHeightExpandedDiffValue(): cssUpdate.top;
        newLeft = cssUpdate.left;
        maxHeight = cssUpdate.maxHeight? cssUpdate.maxHeight + 'px': undefined;

        // Correct margins for simple case: assume that HLB fits the viewport.
        // Note: there is no documentation describing the way these margins are
        // calculated by. I used my logic & empiristic data.
        var belowBox = hlb.boundingBoxes.below;
        var aboveBox = hlb.boundingBoxes.above;
        
        var expandedHeight = (designer.getHeightExpandedDiffValue() || 0);

        var compensateVertShiftFloat = parseFloat(compensateShift['vert']) - expandedHeight;
        var compensateHorizShiftFloat = parseFloat(compensateShift['horiz']);

        var vertMargin = {};
        var horizMargin = {'margin-left': compensateHorizShiftFloat + 'px'};

        if (compensateVertShiftFloat) { // note: similar logic is used in getRoundings
            if (currentStyle['clear'] === 'both') {
                if (belowBox && parseFloat($(belowBox).css('margin-top')) <= Math.abs(compensateVertShiftFloat)) {
                    vertMargin['margin-bottom'] = compensateVertShiftFloat + 'px';
                } else if (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) <= Math.abs(compensateVertShiftFloat)) {
                    vertMargin['margin-top'] = compensateVertShiftFloat + 'px';
                }
            } else {
                // The current element has biggest the top & bottom margins initially but new one(s) are smaller.
                if (compensateVertShiftFloat > 0 // New margin is positive.
                    && (belowBox && parseFloat($(belowBox).css('margin-top')) >= compensateVertShiftFloat)
                    && (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) >= compensateVertShiftFloat)) {
                        vertMargin = {'margin-top': - compensateVertShiftFloat / 2 + 'px', 'margin-bottom': - compensateVertShiftFloat / 2 + 'px'};
                } else if (compensateVertShiftFloat < 0
                    && (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) <= parseFloat(currentStyle['margin-top']))) {
                        vertMargin['margin-bottom'] = compensateVertShiftFloat + 'px';
                } else {
                    vertMargin['margin-top'] = parseFloat(currentStyle['margin-top']) + compensateVertShiftFloat + 'px';
                }
            }
        }

        // Margins affect the element's position. To make sure top & left are
        // correct we need to substract margin value from them. 
        // newTop  = newTop  && (parseFloat(newTop)  - compensateVertShiftFloat);
        // newLeft = newLeft && (parseFloat(newLeft) - compensateHorizShiftFloat);

        var cssBeforeAnimateStyles = {
          'position': 'relative',
          'top': newTop && newTop + 'px',
          'left': newLeft && newLeft + 'px',
          'height': maxHeight? undefined: newHeight && parseFloat(newHeight) + 'px',
          'max-height': maxHeight,
          'width':  newWidth,
          'box-sizing': 'content-box',

          'z-index': hlbStyle.kBoxZindex.toString(),
          'border' : hlbStyle.kBoxNoOutline,
          'list-style-position': 'inside',
          'margin-top': currentStyle['margin-top'],
          'margin-right': currentStyle['margin-right'],
          'margin-bottom': currentStyle['margin-bottom'],
          'margin-left': currentStyle['margin-left'],
          'border-radius': hlbStyle.kBoxBorderRadius + 'px',
          'border-color':  hlbStyle.kBoxBorderColor,
          'border-style':  hlbStyle.kBoxBorderStyle,
          'border-width':  hlbStyle.kBoxBorderWidth + 'px',
          'outline'   :  hlbStyle.kBoxNoOutline,

          'overflow-y': newOverflowY,
          'overflow-x': 'hidden',
  
          // Animation.
          'webkit-transform-origin': '50% 50%',
          '-moz-transform-origin': '50% 50%',
          'transform-origin': '50% 50%'
        };

        // If there any interesting float we need to do some more adjustments for height/width/top etc.
        var floatRectHeight = setStyleForInterestingFloatings(cssBeforeAnimateStyles, currentStyle);
        vertMargin['margin-bottom'] = (parseFloat(vertMargin['margin-bottom']) || parseFloat(currentStyle['margin-bottom']))
                                    - floatRectHeight + 'px';

        var extraIndent = 2 * hlbStyle.kBoxBorderWidth;
        // Leave some extra space for text, only if there's no background image which is displayed incorrectly in this case.
        // todo: take out 'assumedToBeText' to common.js; also used in designer.js
        var assumedToBeText = !(currentStyle['display'] === 'inline-block' || currentStyle['display'] === 'inline'
                // nytimes.com images such as $('.thumb.runaroundRight')
                || (hlb.item.localName === 'img' && hlb.$item.parent().css('float') !== 'none'));
        if (assumedToBeText) {
            cssBeforeAnimateStyles['padding'] = hlbStyle.kBoxPadding + 'px';
            extraIndent += 2 * hlbStyle.kBoxPadding;

            // Floated menu items get overall/outer width specified below
            // Other floated elements get the same value as content/inner width only
            // todo: Define the cases when we need ti shrink/expand width with the extraIndent.
            // (for now I give a favour to eeoc.gov where we need to shrink it)
            cssBeforeAnimateStyles['width']  = currentStyle['float'] === 'none'
                                             ? cssBeforeAnimateStyles['width']
                                             : parseFloat(cssBeforeAnimateStyles['width']) + extraIndent + 'px';
        }

        $.extend(cssBeforeAnimateStyles, vertMargin);
        $.extend(cssBeforeAnimateStyles, horizMargin);

        if (hlb.item.tagName.toLowerCase() === 'img') {
          designer.preserveImageRatio(cssBeforeAnimateStyles, cssUpdate, hlb.clientRect);
        }

        hlb.setBgStyle(currentStyle, cssBeforeAnimateStyles);

        return cssBeforeAnimateStyles;
      };


        hlbStyle.getCssAnimateStyles = function(kExtraZoom) {
          return {
            'webkit-transform': 'scale(' + kExtraZoom + ')',
            '-moz-transform':   'scale(' + kExtraZoom + ')',
            '-o-transform':     'scale(' + kExtraZoom + ')',
            '-ms-transform':    'scale(' + kExtraZoom + ')',
            'transform':        'scale(' + kExtraZoom + ')'
          };
        };

    // Done.
    callback();
    });
});