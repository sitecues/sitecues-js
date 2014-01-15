sitecues.def('fixFixedPanelAndBadge', function (fixFixedPanelAndBadge, callback, log) {
  
  'use strict';

  sitecues.use('jquery', 'zoom', 'conf', 'badge', 'platform', function ($, zoom, conf, badge, platform) {

    var fixedElements,
        fixBadge = (function () {
          if ($('#sitecues-badge').css('position') === 'fixed') {
            return true;
          }
          return false;
        }());

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
    var fixBadgeAndPanelOnScroll = function () {
    
      var currentTransformBadge = getTranslate(document.getElementById('sitecues-badge')),
          currentTransformPanel = getTranslate(document.getElementById('sitecues-panel')),
          currentZoom           = conf.get('zoom'),
          lastScrollX           = zoom.lastScroll[0],
          lastScrollY           = zoom.lastScroll[1],
          currentScrollX        = window.pageXOffset/currentZoom,
          currentScrollY        = window.pageYOffset/currentZoom,
          //Add the amount scrolled since the last scroll
          badgeTranslateX = (currentTransformBadge[0] * currentZoom) + (currentScrollX - lastScrollX) * currentZoom,
          badgeTranslateY = (currentTransformBadge[1] * currentZoom) + (currentScrollY - lastScrollY) * currentZoom,
          panelTranslateX = (currentTransformPanel[0] * currentZoom) + (currentScrollX - lastScrollX) * currentZoom,
          panelTranslateY = (currentTransformPanel[1] * currentZoom) + (currentScrollY - lastScrollY) * currentZoom;
      
      if (fixBadge) {
        if (!platform.browser.isIE) {
          $('#sitecues-badge').css({
            'transform':'scale('+1/currentZoom+') translate(' + badgeTranslateX + 'px, ' + badgeTranslateY + 'px)'
          });
        }
      }
      if (!platform.browser.isIE) {
        $('#sitecues-panel').css({
          'transform':'scale('+1/currentZoom+') translate(' + panelTranslateX + 'px, ' + panelTranslateY + 'px)'
        });
      }
    };

    var fixBadgeAndPanelOnZoom = function () {
      if (fixBadge) {
        if (!platform.browser.isIE) {
          if (zoom.badgeBoundingBox) {
            $('#sitecues-badge').css({'transform': ''})
            $('#sitecues-badge').css({
              'transform-origin' : '0% 0%',
              'transform': 'scale('+1/conf.get('zoom')+')' + 
                           'translate(' + (zoom.badgeBoundingBox.left - document.getElementById('sitecues-badge').getBoundingClientRect().left) + 'px, ' + 
                                          (zoom.badgeBoundingBox.top  - document.getElementById('sitecues-badge').getBoundingClientRect().top)  + 'px) ' 
            });
            
          }
        } 
      }
      if (!platform.browser.isIE) {
        if (zoom.panelBoundingBox) {
          $('#sitecues-panel').css({'transform': ''})
          $('#sitecues-panel').css({
            'transform-origin' : '0% 0%',
            'transform': 'scale('+1/conf.get('zoom')+')' +
                         'translate(' + (zoom.panelBoundingBox.left - document.getElementById('sitecues-panel').getBoundingClientRect().left) + 'px, ' + 
                                        (zoom.panelBoundingBox.top  - document.getElementById('sitecues-panel').getBoundingClientRect().top)  + 'px) ' 
          });
        }
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
    var fixFixedElements = function (elements) {
         
      if (!elements || !elements.length) return;
      /*
        For every fixed element on the page, we must translate them to their correct positions using
        transforms.  This basically happens on scroll events.  Some of these elements, specifically 
        the badge and panel, already have transforms applied.  Therefore, we must apply
        the transforms that are reactions to the scroll events on top of any transforms.
       */
      for (var i = 0; i < elements.length; i += 1) {
        if (!platform.browser.isIE) {
          $(elements[i]).css({
            'transform':'translate(' + window.pageXOffset/conf.get('zoom') + 'px, ' + 
                                       window.pageYOffset/conf.get('zoom') + 'px)'
          });
        } else {
          $(elements[i]).css({
            'transform':'scale('+conf.get('zoom')+')',
            'transform-origin':(-($(elements[i]).get(0).getBoundingClientRect().left)/conf.get('zoom')) + 'px ' + 
                               (-($(elements[i]).get(0).getBoundingClientRect().top)/conf.get('zoom')) + 'px'
          })
        }       
      }
    };
    /**
     * [When the page scrolls, reposition fixed elements, badge, and panel]
     */
    sitecues.on('scroll', function (e) {
      fixedElements = getFixedElementsMinusBadgeAndPanel(); //There might be new fixed elements, so cache them.
      fixFixedElements(fixedElements); //Reposition the fixed elements
      fixBadgeAndPanelOnScroll(); //Reposition the badge and panel
    });
    /**
     * [Prepare to reposition fixed elements, badge, and panel]
     */
    sitecues.on('zoomBefore', function (value) {
      
      if (fixBadge) {
        if (!zoom.badgeBoundingBox && $('#sitecues-badge').length) {
          zoom.badgeBoundingBox = document.getElementById('sitecues-badge').getBoundingClientRect();
        }
      }
      if ($('#sitecues-panel').length) {
        zoom.panelBoundingBox = document.getElementById('sitecues-panel').getBoundingClientRect();
      }  
     
    });
    /**
     * [Now that the html element has a new level of scale and width, reposition fixed elements, badge, and panel]
     */
    sitecues.on('zoomAfter', function (value) {
      fixFixedElements(fixedElements)
      fixBadgeAndPanelOnZoom();      
    });

  });

});