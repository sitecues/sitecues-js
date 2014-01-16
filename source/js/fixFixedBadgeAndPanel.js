sitecues.def('fixFixedPanelAndBadge', function (fixFixedPanelAndBadge, callback, log) {
  
  'use strict';

  sitecues.use('jquery', 'zoom', 'conf', 'badge', 'platform', function ($, zoom, conf, badge, platform) {

    var fixedElements, //All elements on a page that have fixed positions, with the exception of panel & badge
        
        fixBadge = (function () { //boolean to determine if badge requires repositioning
                     if ($('#sitecues-badge').css('position') === 'fixed') {
                       return true;
                     } else {
                       return false;
                     }
                   }()),
        lastScrollY = 0,
        lastScrollDirection = null,
        verticalShift = 0;
    
    var scrollCheck = function (e) {
      var newScrollY = window.scrollY || window.pageYOffset;

      if (lastScrollY < newScrollY) {
        lastScrollDirection = 1; // Down
      } else if (lastScrollY > newScrollY) {
        lastScrollDirection = -1; // Up
      }

      lastScrollY = newScrollY;

      if (lastScrollDirection === 1 && (platform.ieVersion.isIE10 || platform.ieVersion.isIE11)){
        var marginTop = parseInt($('body').css('marginTop').split('px')[0]),
        paddingTop = parseInt($('body').css('paddingTop').split('px')[0]);
        verticalShift = (window.pageYOffset + $('body').get(0).getBoundingClientRect().top) - (marginTop*conf.get('zoom'));
      }else{
        verticalShift = 0;
      }
    };
    /**
     * [Helper function that returns the translateX and translateY of an element]
     * @return {[array]} [translateX and translateY of an element]
     */
    var getTranslate = (function () {
      var _MATRIX_REGEXP = /matrix\s*\(\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*,\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*\)/i;
      return function (element) {
        if ($(element).css('transform') === 'none') {
          return [0, 0];
        }
        var transformArray = _MATRIX_REGEXP.exec($(element).css('transform'))[0].split(','),
            translateX = transformArray[4],
            translateY = transformArray[5];
        return [parseFloat(translateX), parseFloat(translateY)];
      };
    }());
    
    //We should investigate if we can break this method (e.g. scrolling really fast)
    /**
     * [fixBadgeAndPanelOnScroll Fixes the positioning of the panel and badge.]
     * @return {[undefined]}
     */
    var fixBadgeAndPanel = function () {
    
      if (fixBadge) {                  //If the badge is fixed
        if (!platform.browser.isIE) {  //If the browser is not IE
          if (zoom.badgeBoundingBox) { //If the bounding box of the badge is cached
            $('#sitecues-badge').css({'transform': ''}); //Remove all transforms
            //Set the origin to top left, Inversely scale, Translate by the difference between the cached coordinates and the current coordinates
            $('#sitecues-badge').css({  
              'transform-origin' : '0% 0%',
              'transform': 'scale('+1/conf.get('zoom')+')' +
                           'translate(' + (zoom.badgeBoundingBox.left - document.getElementById('sitecues-badge').getBoundingClientRect().left) + 'px, ' + 
                                          (zoom.badgeBoundingBox.top  - document.getElementById('sitecues-badge').getBoundingClientRect().top)  + 'px) ' 
            });            
          }
        } else {
          $('#sitecues-badge').css({'transform':'translate(0px,'+verticalShift+'px)'})
        }
      }
      if (!platform.browser.isIE) { //If the browser is not IE
        if (zoom.panelBoundingBox) {//If the bounding box of the panel is cached
          $('#sitecues-panel').css({'transform': ''}); //Remove all transforms
          //Set the origin to top left, Inversely scale, Translate by the difference between the cached coordinates and the current coordinates 
          $('#sitecues-panel').css({ 
            'transform-origin' : '0% 0%',
            'transform': 'scale('+1/conf.get('zoom')+')' +
                         'translate(' + (zoom.panelBoundingBox.left - document.getElementById('sitecues-panel').getBoundingClientRect().left) + 'px, ' + 
                                        (zoom.panelBoundingBox.top  - document.getElementById('sitecues-panel').getBoundingClientRect().top)  + 'px) ' 
          });
        }
      } else {
        $('#sitecues-panel').css({'transform':'translate(0px,'+verticalShift+'px)'})
      }
    };
    /**
     * [getFixedElementsMinusBadgeAndPanel returns all elements on a page that are fixed and not a sitecues element]
     * @return {[array]} [html elements]
     */
    //Note: The function below is computationally expensive and we may need to execute this on every scroll and
    //      zoom event. Is there a better way?
    var getFixedElementsMinusBadgeAndPanel = function () {
      return $('*').filter(function() {
         return $(this).css("position") === 'fixed' && 
                ($(this).attr('id') !== 'sitecues-badge' && $(this).attr('id') !== 'sitecues-panel');
       });
    };

    /**
     * [Generalized zooming function that works across browsers using CSS Transforms]
     * @param  {[float]} value [The amount we will transform scale the html element]
     */
    var fixFixedElements = function (elements, value) {
      
      var value = value || conf.get('zoom');
      
      if (!elements || !elements.length) return;
      /*
        For every fixed element on the page, we must translate them to their correct positions using
        transforms.  This basically happens on scroll events.  Some of these elements, specifically 
        the badge and panel, already have transforms applied.  Therefore, we must apply
        the transforms that are reactions to the scroll events on top of any transforms.
       */
      console.log(verticalShift)
      for (var i = 0; i < elements.length; i += 1) {
        if (!platform.browser.isIE) {
          $(elements[i]).css({
            'transform':'translate(' + window.pageXOffset/conf.get('zoom') + 'px, ' + 
                                       window.pageYOffset/conf.get('zoom') + 'px)'
          });
        } else {
          $(elements[i]).css({'transform':''});
          $(elements[i]).css({
            'transform':'scale('+conf.get('zoom')+')',
            'transform-origin':(-($(elements[i]).get(0).getBoundingClientRect().left)) + 'px ' + 
                               (-($(elements[i]).get(0).getBoundingClientRect().top) - verticalShift/value) + 'px'
          })
        }       
      }
    };
    /**
     * [When the page scrolls, reposition fixed elements, badge, and panel]
     */
    sitecues.on('scroll', function (e) {
      scrollCheck();
      fixBadgeAndPanel(); //Reposition the badge and panel
      fixedElements = getFixedElementsMinusBadgeAndPanel(); //There might be new fixed elements, so cache them.
      fixFixedElements(fixedElements); //Reposition the fixed elements
    });
    /**
     * [Now that the html element has a new level of scale and width, reposition fixed elements, badge, and panel]
     */
    sitecues.on('zoomAfter', function (value) {
      fixBadgeAndPanel();
      fixFixedElements(fixedElements, value);      
    });
    //When the panel has completed its animation, cache the coordinates
    sitecues.on('panel/show', function () {
      if ($('#sitecues-panel').length) {
        zoom.panelBoundingBox = document.getElementById('sitecues-panel').getBoundingClientRect();
      }  
    });
    //When the badge has completed its animation, cache the coordinates
    sitecues.on('badge/show', function () {
      if (fixBadge) {
        if (!zoom.badgeBoundingBox && $('#sitecues-badge').length) {
          zoom.badgeBoundingBox = document.getElementById('sitecues-badge').getBoundingClientRect();
        }
      }
    });

    fixFixedElements(getFixedElementsMinusBadgeAndPanel(), conf.get('zoom'));

  });

});