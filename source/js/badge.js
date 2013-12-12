sitecues.def('badge', function (badge, callback, log) {

  'use strict';

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use('jquery', 'conf', 'panel', 'util/common', 'html-build', 'fallback', function ($, conf, panel, common, htmlBuild, fallback) {

    var REPLACE_BADGE_ATTR = 'data-toolbar-will-replace';
    // This property is used when a site wants to use an existing element as a badge, rather than the standard sitecues one.
    badge.altBadges = $(conf.get('panelDisplaySelector'));
    badge.badgeId   = conf.get('badgeId');

    if (!badge.badgeId) {
      // Use the default value
      badge.badgeId = 'sitecues-badge';
    } 
  /**
   * Creates a markup for new badge and inserts it right into the DOM.
   * @param function success
   * @returns void
   */
    badge.create = function(success) {
      badge.panel = htmlBuild.$div()
              .attr('id', badge.badgeId) // set element id for proper styling
              .attr(REPLACE_BADGE_ATTR, true)
              .addClass('sitecues-badge')
              .hide()
              .appendTo('html');
      // Determine the badge visible width
      var badgeVisibleWidth = badge.panel.outerWidth();

      // Right align the badge, but do this is a way in which the (dis)appearance of the
      // body vertical scrollbar will not affect placement.
      common.addRightAlignIgnoreScrollbar({
        obj: badge,
        getWidth: function() { return badgeVisibleWidth;},
        getRightOffset: function() { return 5; },
        setCss: function(jCssObj) { badge.panel.css(jCssObj); }
      });

      // create badge image inside of panel
      badge.element = $('<img>')
       .attr('id', 'sitecues-badge-image')
       .addClass('sitecues-badge-image')
       .attr('src', sitecues.resolveSitecuesUrl('../images/eq360-badge.png'))
       .appendTo(badge.panel);
      
      if (success) {
        success();
      }
    };
    /**
     * Hides the badge.
     *
     * @param success Function executed if successful.
     * @return void
     */
    badge.hide = function (success) {
      $(badge.panel).fadeOut('fast', function() {
        if (success) {
          success();
        }
      });
    };
    /**
     * Shows the badge, if possible.  Uses siteUI and defaultUI settings.
     *
     * @param success Function executed if successful.
     * @return void
     */
    badge.show = function(success) {
      if (conf.get('badgeEnabled')) {
        log.info('Showing badge');
        $(badge.panel).fadeIn('slow', function() {
          if (success) {
            success();
          }
        });
      } else {
        log.warn('badge.show() was called but badge is disabled');
      }
    };

    /**
     * Closes the badge and sets the preference so it stays closed.
     *
     * @param success Function executed if successful.
     * @return void
     */
    badge.disable = function (success) {
      log.info('Disabling badge');
      conf.set('badgeEnabled', false);
      badge.hide(success);
    };

    /**
     * Opens the badge and sets the preference so it stays opened.
     *
     * @param success Function executed if successful.
     * @return void
     */
    badge.enable = function (show, success) {
      log.info('Enabling badge');
      conf.set('badgeEnabled', true);
      if(show) {
        badge.show(success);
      } else if (success) {
        success();
      }
    };
 
    // BODY
    var $badge = $('#' + badge.badgeId);
<<<<<<< HEAD
      if (badge.altBadges && (badge.altBadges.length > 0)) {
        badge.panel   = badge.altBadges;
        badge.element = badge.panel;
      } else if ($badge.length > 0) {
        badge.panel   = $badge;
        badge.element = badge.panel;
      } else {
        // We have no alternate or pre-existing badges defined, so create a new one.
        badge.create();
      }
 
=======

    if (badge.altBadges && (badge.altBadges.length > 0)) {
      badge.panel   = badge.altBadges;
      badge.element = badge.panel;
    } else if ($badge.length > 0) {
      badge.panel   = $badge;
      badge.element = badge.panel;
    } else {
      // We have no alternate or pre-existing badges defined, so create a new one.
      badge.create();
    }

<<<<<<< HEAD
      
>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055
=======
>>>>>>> 181cd6407fb84277c56117689531554db420d31f
    panel.parent  = badge.element;
    $badge = $('#' + badge.badgeId);

    var isBadgeInDom = $badge && $badge.length > 0;
 
    // EQ-770: check if badge is created by site provided script or by extension-based one.
    // When Al MacDonald completes his work, we will probably need to modify it according to his mechanism.
    badge.isBadgeRaplacedByToolbar = isBadgeInDom && $badge.attr(REPLACE_BADGE_ATTR) === 'true';

<<<<<<< HEAD
    /* EQ-881: As a customer, I want sitecues to degrade gracefully or provide
    /* a useful fallback when it can't work, so that my users aren't confused by the icon.*/
    var _requiresFallback = platform.requiresFallback,
        _supportsTouch = platform.isTouchDevice;

      /* EQ-657 - Handle tablet and smartphone case
      /* Determine if event was touch based - only limited to event at this level
      /* 'msgesturechange' is for IE10 - wtf?! */
      var setFallbackEvents = function (evt){
                                  evt.preventDefault();
                                  fallback.show();
                                };
      var setDefaultEventOver = function (evt) {
                                  sitecues.emit('badge/hover', badge.element);
                                };     
      var setDefaultEventLeave = function (evt) {
                                  sitecues.emit('badge/leave', badge.element);
                                };   
     
      // Check if fallbacks are enabled otherwise use default hover
      if (window.sitecues.getLibraryConfig().fallback.enabled) {
        console.log('fallbacks are enabled')
           log.info('fallbacks are enabled');
            // Delegate Events
           if( _requiresFallback || _supportsTouch ) { 
             
                  switch(_supportsTouch){
                    case true: 
                          $(badge.panel).on( 'touchstart' || 'touchmove' || 'touchend' || 'msgesturechange', setFallbackEvents );
                      break;
                    case false: 
                          $(badge.panel).on( 'click', setFallbackEvents );
                      break;
                    }

                  if( _requiresFallback && _supportsTouch ){
                    $(badge.panel).on( 'click' || 'touchstart' || 'touchmove' || 'touchend' || 'msgesturechange', setFallbackEvents );
                  }
          
            }else{
                // sitecues deployed without need for fallback.',
                $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave); 
              }
        
              } else {

                  $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave);
                  console.log("Fallback modal is currently disabled.")
                  log.warn("Fallback modal is currently disabled.");
                }
=======
    // EQ-881: As a customer, I want sitecues to degrade gracefully or provide
    // a useful fallback when it can't work, so that my users aren't confused by the icon.
    var setFallbackEvents = function (evt){
      evt.preventDefault();
      fallback.show();
    };
  
    var setDefaultEventOver = function (evt) {
      evt.stopPropagation();
      return sitecues.emit('badge/hover', badge.element);
    };     
  
    var setDefaultEventLeave = function (evt) {
      evt.stopPropagation();
      return sitecues.emit('badge/leave', badge.element);
    };  

    var watchMouseConnection = function(evt){
      evt.stopPropagation();
      sitecues.mousePresent = true;
      
      $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave);
      // $(badge.panel).unbind( 'click' && 'touchstart' && 'touchmove' && 'touchend' && 'msgesturechange' );
      // Should we 'unbind'?
      window.removeEventListener('mousemove', watchMouseConnection, false);
      
      // The function (in progress) below will be to account
      // for mouse connectivity, specifically for touch
      //
      // var checkMousePulse = function () {
      //   var thisDeviceStatus;
      //   window.addEventListener('mousemove', watchMouseConnection, false);
      // };
      //Check on mouse status every 15 seconds
      //setInterval( checkMousePulse, 15000); 
    };


    if( fallback.isEnabled ){
/**
* Check if user is on a supported platform
**/
      switch(sitecues.supportedPlatform){
      case true:

        $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave); 
/** 
* Check for touch support
**/
        if(sitecues.supportsTouch){
          sitecues.mousePresent = false;
          $(badge.panel).on( 'touchstart' || 'touchmove' || 'touchend' || 'msgesturechange', setFallbackEvents );
/**
* Listen for mouse
*/  
          window.addEventListener('mousemove', watchMouseConnection, false);
        }

        log.info('Compatibility fallback is enabled to simulate a production environment - use sitecues.toggleFalllback() to toggle for development.');

        break;
      case false:
/** 
* Not a supported platform
**/
        $(badge.panel).on('click', setFallbackEvents);
        break;
      }

    } else {
/** 
* Fallback is not enabled
* Defaults to normal behavior
**/
      $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave); 
      log.info('Compatibility fallback is not enabled - use sitecues.toggleFalllback() to disable for development.');
    }
>>>>>>> 9d37c1f64b193bc6ffbc99f752aff23ab15c4055

    sitecues.on('badge/enable', function() {
      badge.enable(true);
    });

    if (sitecues.tdd) {
      // todo: maybe export the whole module instead if every single function?
      exports.badge = badge;
    }

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});