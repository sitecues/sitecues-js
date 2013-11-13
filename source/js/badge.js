sitecues.def('badge', function (badge, callback, log) {

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use('jquery', 'conf', 'panel', 'ui', 'util/common', 'html-build', 'zoom', 'browser/check', 'compatibility/fallback', function ($, conf, panel, ui, common, htmlBuild, zoom, browserCheck, fallback) {

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
              // .prependTo('html');
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
    }

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
        log.warn("badge.show() was called but badge is disabled");
        throw e;
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
    panel.parent  = badge.element;

    $badge = $('#' + badge.badgeId);
    var isBadgeInDom = $badge && $badge.length > 0;
    
    


    // EQ-770: check if badge is created by site provided script or by extension-based one.
    // When Al MacDonald completes his work, we will probably need to modify it according to his mechanism.
    badge.isBadgeRaplacedByToolbar = isBadgeInDom && $badge.attr(REPLACE_BADGE_ATTR) === 'true';

    //EQ-881: As a customer, I want sitecues to degrade gracefully or provide
    //a useful fallback when it can't work, so that my users aren't confused by the icon.
      var _requiresFallback = browserCheck._reqFallback;

      switch(_requiresFallback){
             case true:

                      fallback.create();

                      $(badge.panel).on("click", function (evt) {
                              fallback.slideDown();
                          });

                      break;
              case false:
                          $(badge.panel).hover(function (evt) {
                              sitecues.emit('badge/hover', badge.element); // emit event about hover
                          }, function () {
                              sitecues.emit('badge/leave', badge.element); // emit event about leave
                          });
                      break;  
                      }      



    
    //I removed the hover event in favor of mouseenter/mouseleave for more control over
    //firing specific events
//     $(badge.panel).on("mouseenter", function () {

//         var _e = evt;
//           _e.preventDefault();

//           

//               fallback.create();
//             break;
//             case false:

//               return sitecues.emit('badge/hover', badge.element);
//           }


// });

//      $(badge.panel).on("mouseleave", function () {

//       if( $("#sitecues-panel").is(":visible") ){
//             sitecues.emit('badge/leave', badge.element); // emit event about leave
//           }


//      });

    

      sitecues.on("badge/enable", function() {
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