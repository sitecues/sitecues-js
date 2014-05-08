sitecues.def('fixFixedPanelAndBadge', function (fixFixedPanelAndBadge, callback) {
  
  'use strict';

  sitecues.use('jquery', 'zoom', 'conf', 'badge', 'platform', 'cursor', function ($, zoom, conf, badge, platform, cursor) {

    var fixedElements, //All elements on a page that have fixed positions, with the exception of panel & badge
        
        fixBadge                 = $('#sitecues-badge').css('position') === 'fixed',
        lastScrollY              = 0,    //IE specific fix
        lastScrollDirection      = null, //IE specific fix
        verticalShift            = 0,    //IE specific fix
        elementsToCheck          = [],  //CSS selectors & properties that specify position:fixed
        elementsToUnfix          = [];  //Elements that are fixed and can be selected by one of the
                                        //selectors in elementsToCheck
    /**
     * [scrollCheck specifically applied an offset which only happens in IE10 & IE11]
     * @param  {[object]} e [scroll event]
     */
    var scrollCheck = function () {

      var newScrollY = window.scrollY || window.pageYOffset;

      if (lastScrollY < newScrollY) {
        lastScrollDirection = 1; // Down
      } else if (lastScrollY > newScrollY) {
        lastScrollDirection = -1; // Up
      }

      lastScrollY = newScrollY;

      if (lastScrollDirection === 1 && (platform.ieVersion.isIE10 || platform.ieVersion.isIE11)){
        var marginTop = parseInt($('body').css('marginTop'));
        verticalShift = (window.pageYOffset + $('body').get(0).getBoundingClientRect().top) - (marginTop*conf.get('zoom'));
      } else{
        verticalShift = 0;
      }
    };
    /**
     * [fixBadgeAndPanelOnScroll Fixes the positioning of the panel and badge.]
     * @return {[undefined]}
     */
    var fixBadgeAndPanel = function () {
      var badgeBoundingBox,
          panelBoundingBox;
      //Badge positioning
      if (fixBadge) {                  //If the badge is fixed
        if (!platform.browser.isIE) {  //If the browser is not IE
          if (zoom.badgeBoundingBox) { //If the bounding box of the badge is cached
            $('#sitecues-badge').css({'transform': ''}); //Remove all transforms
            //Set the origin to top left, Inversely scale, Translate by the difference between the cached coordinates and the current coordinates
            badgeBoundingBox = document.getElementById('sitecues-badge').getBoundingClientRect();
            $('#sitecues-badge').css({  
              'transform-origin' : '0% 0%',
              'transform': 'scale('+1/conf.get('zoom')+')' +
                           'translate(' + (zoom.badgeBoundingBox.left - badgeBoundingBox.left) + 'px, ' + 
                                          (zoom.badgeBoundingBox.top  - badgeBoundingBox.top)  + 'px) ' 
            });            
          }
        } else {
          $('#sitecues-badge').css({'transform':'translate(0px,'+verticalShift+'px)'});
        }
      }
      //Panel positioning
      if (!platform.browser.isIE) { //If the browser is not IE
        if (zoom.panelBoundingBox) {//If the bounding box of the panel is cached
          $('#sitecues-panel').css({'transform': ''}); //Remove all transforms
          //Set the origin to top left, Inversely scale, Translate by the difference between the cached coordinates and the current coordinates 
          panelBoundingBox = document.getElementById('sitecues-panel').getBoundingClientRect();
          $('#sitecues-panel').css({ 
            'transform-origin' : '0% 0%',
            'transform': 'scale('+1/conf.get('zoom')+')' +
                         'translate(' + (zoom.panelBoundingBox.left - panelBoundingBox.left) + 'px, ' + 
                                        (zoom.panelBoundingBox.top  - panelBoundingBox.top)  + 'px) ' 
          });
        }
      } else {
        $('#sitecues-panel').css({'transform':'translate(0px,'+verticalShift+'px)'});
      }
    };
    /**
     * [getFixedElementsMinusBadgeAndPanel returns all elements on a page that are fixed and not a sitecues element]
     * @return {[array]} [html elements]
     */
    //Note: The function below is computationally expensive and we may need to execute this on every scroll and
    //      zoom event. Is there a better way?
    var getFixedElementsMinusBadgeAndPanel = function () {
      if (fixedElements) {
        return fixedElements;
      } else {
        fixedElements = $('*').filter(function() {
                          return $(this).css('position') === 'fixed' && 
                                  ($(this).attr('id') !== 'sitecues-badge' && $(this).attr('id') !== 'sitecues-panel');
                        }).toArray();
        return fixedElements;
      }
    };

    /**
     * [fixFixedElements positions fixed elements as if they respect the viewport rule]
     * @param  {[array]} elements [elements to position]
     * @param  {[type]} value    [zoom value]
     */
    var fixFixedElements = function (elements, value) {
      
      value = value || conf.get('zoom');
      
      if (!elements || !elements.length) {
        return;
      }
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
          $(elements[i]).css({'transform':''});
          $(elements[i]).css({
            'transform':'scale('+conf.get('zoom')+')',
            'transform-origin':(-($(elements[i]).get(0).getBoundingClientRect().left)) + 'px ' +
                               (-($(elements[i]).get(0).getBoundingClientRect().top) - verticalShift/value) + 'px'
          });
        }       
      }
    };
    /**
     * [unfixFixedFixedElements removes any styles sitecues applies to fixed elements to correctly position them. 
     * This is necessary when the site has javascript which dynamically fixes elements.]
     * @param  {[array]} elements [list of elements]
     */
    var unfixFixedFixedElements = function (elements) {
      if (elements && elements.length) {
        for (var i = 0; i < elements.length; i += 1) {
          $(elements[i]).css({
            'transform': '',
            'transform-origin':''
          });
        }
      }
    };
    /**
     * [getPotentialDynamicallyFixedElements is only used as an internal function to getNewFixedElements]
     * @return {[array]} [Elements which are fixed that use styles defined in stylesheets sitecues parses.]
     */
    var getPotentialDynamicallyFixedElements = function () {
      var elements = [],  
          element;
      for (var i = 0; i < elementsToCheck.length; i += 1) {
        element = $(elementsToCheck[i]);
        if (element.length && element.css('position') === 'fixed') {
          elements.push(element);
        }
      }

      return elements;
    };
    /**
     * [getDynamicFixedElements returns fixed elements parsed from CSS that were not fixed
     * when sitecues loaded.]
     * @return {[array]} [list of elements that are fixed but were previously not fixed]
     */
    var getNewFixedElements = function () {
      
      var potentialDynamicallyFixedElements = getPotentialDynamicallyFixedElements(),
          initialFixedElements              = getFixedElementsMinusBadgeAndPanel(),
          newFixedElements                  = [],
          match                             = false;

      for (var i = 0; i < potentialDynamicallyFixedElements.length; i += 1) {
        for (var j = 0; j < initialFixedElements.length; j += 1) {
          if (potentialDynamicallyFixedElements[i] === initialFixedElements[j]) {
            match = true;
          } 
        }
        if (!match) {
          newFixedElements.push(potentialDynamicallyFixedElements[i]);
        }
        match = false;
      }
      return newFixedElements; //elements that are fixed now, but were not before
    };
    /**
     * [getNewUnfixedElements returns any dynamically fixed elements that are NOT currently 
     * fixed but were previously.]
     * @param  {[array]} newFixedElements [Elements that are dynamically fixed]
     * @return {[array]}                  [dynamically fixed elements that are not fixed]
     */
    var getNewUnfixedElements = function (newFixedElements) {

      var newUnfixedElements = [],
          match              = false,
          i, j; 
      
      for (i = 0; i < newFixedElements.length; i += 1) { //if there are any new fixed elements, cache them.
        for (j = 0; j < elementsToUnfix.length; j += 1) {
          if ($(newFixedElements[i]).get(0) === $(elementsToUnfix[j]).get(0)) {
            match = true;
          }
        }
        if (!match) {
          elementsToUnfix.push(newFixedElements[i]);
        }
        match = false;
      }
      for (i = 0; i < elementsToUnfix.length; i += 1) {
        for (j = 0; j < newFixedElements.length; j += 1) {
          if ($(elementsToUnfix[i]).get(0) === $(newFixedElements[j]).get(0)) {
            match = true;
          }
        }
        if (!match) {
          //The code below is equivelant to the code in this comment
          //var element = elementsToUnfix.splice(i, 1)[0]; 
          //newUnfixedElements.push(element);
          newUnfixedElements.push(elementsToUnfix.splice(i, 1)[0]);
          i -= 1;
        }
        match = false;
      }
      return newUnfixedElements;
    };
    /**
     * [When the page scrolls, reposition fixed elements, badge, and panel]
     */
    sitecues.on('scroll', function () {
      var newFixedElements = getNewFixedElements();  
      scrollCheck();
      fixBadgeAndPanel(); //Reposition the badge and panel
      fixFixedElements(getFixedElementsMinusBadgeAndPanel().concat(newFixedElements)); //Reposition the fixed elements
      unfixFixedFixedElements(getNewUnfixedElements(newFixedElements));
    });
    /**
     * [Now that the html element has a new level of scale and width, reposition fixed elements, badge, and panel]
     */
    sitecues.on('zoom', function (value) {
      if (!zoom.resizing) {
        var newFixedElements = getNewFixedElements();  
        fixBadgeAndPanel();
        fixFixedElements(getFixedElementsMinusBadgeAndPanel().concat(newFixedElements), value);
        unfixFixedFixedElements(getNewUnfixedElements(newFixedElements));
      }   
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
    /**
     * [A continuation of positioning logic from common.js.  Instead of using a setTimeout, we created a specific
     * event that is fired when the positioning logic is complete in common.js until a better re-factoring]
     */
    sitecues.on('resizeEndEnd', function () {
      if (fixBadge) {
        if ($('#sitecues-badge').length) {
          if (!platform.browser.isIE) {
            $('#sitecues-badge').css({
              'transform':'scale('+1/conf.get('zoom')+') translate('+ window.pageXOffset +'px, '+ window.pageYOffset +'px)'
            });
          }
          if (zoom.badgeBoundingBox) {
            zoom.badgeBoundingBox = document.getElementById('sitecues-badge').getBoundingClientRect();
          }
        }
      }
    });
    /**
     * [Listens for events emitted by the cursor module, which indicates that new CSS has
     * been added to the <style id='sitecues-css'></style>.  This is necessary to get any
     * fixed positioned elements that are not used on a page when sitecues first loads.
     * Basically, it gets any styles that declare position:fixed so we can later filter for
     * any elements that are dynamically fixed.]
     * @return {[type]} [description]
     */
    sitecues.on('cursor/addingStyles', function () {

      elementsToCheck = [];
      
      cursor.changeStyle('position', function (rule, style, styleObject) {
        if (rule[style] === 'fixed') {
          elementsToCheck.push(styleObject.selectorText);
        }
      });

    });

    fixFixedElements(getFixedElementsMinusBadgeAndPanel(), conf.get('zoom'));
    $(window).trigger('resizeEnd');
    callback();
  });
});