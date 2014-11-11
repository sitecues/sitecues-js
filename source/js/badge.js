sitecues.def('badge', function(badge, callback) {

    'use strict';

    // use jquery, we can rid off this dependency
    // if we will start using vanilla js functions
    sitecues.use('jquery', 'panel', 'html-build', function($, panel, htmlBuild) {

        // This property is used when a site wants to use an existing element as a badge, rather than the standard sitecues one.
        var BADGE_ID = 'sitecues-badge',
          BADGE_CHECK_INTERVAL = 300,
          $badge;

        /**
         * Creates a markup for new floating badge and inserts it right into the DOM.
         */
        function createFloatingBadge() {
          // We have no alternate or pre-existing badges defined, so create a new one.
          var $badgeContainer =
              htmlBuild.$div()
                .attr('id', BADGE_ID) // set element id for proper styling
                .addClass('sitecues-badge')
                .appendTo('html');

          // create badge image inside of panel
          $badge = $('<img>')
            .attr('id', 'sitecues-badge-image')
            .addClass('sitecues-badge-image')
            .attr('src', sitecues.resolveSitecuesUrl('../images/eq360-badge.png'))
            .appendTo($badgeContainer);

          setBadgeHooks($badge);
        }

        function setBadgeHooks($badge) {
          panel.parent = $badge;
          $badge
            .hover(setDefaultEventOver, setDefaultEventLeave)
            .on('keydown', onBadgeKey);
        }

        function onBadgeKey(evt) {
          if (evt.keyCode === 13 || evt.keyCode === 32) {  // Enter or space key
            sitecues.emit('info/help');
          }
        }

        function getBadge() {
          return $('#' + BADGE_ID);
        }

        function findAndInitBadge() {
          var interval;

          function initAvailableBadge() {
            var $badge = getBadge();
            if ($badge.length) {
              clearInterval(interval);
              $badge
                .css({
                  visibility: 'visible',
                  opacity: 1,
                  transition: 'opacity 0.6s linear'
                });
              if ($badge.closest('a').length === 0) {
                // Add accessibility if it's not already done
                $badge.attr({
                  tabindex: 0,
                  role: 'button',
                  alt: 'sitecues zoom and speech tools: press Enter for more information'
                });
              }
              setBadgeHooks($badge);
              return true;
            }
            if (document.readyState === 'complete') {
              // Create floating badge if appropriate
              clearInterval(interval);
              console.log('sitecues info: no sitecues badge with id="sitecues-badge" found.');
              // The floating badge is never meant to be seen by end-users of a website that has sitecues integrated.
              // Therefore, we need to show information to the site owner so that they can add the badge
              createFloatingBadge();
              return true;
            }
          }

          if (!initAvailableBadge()) {
            interval = setInterval(initAvailableBadge, BADGE_CHECK_INTERVAL);
          }
        }

        var setDefaultEventOver = function() {
            return sitecues.emit('badge/hover', badge.element);
        };

        var setDefaultEventLeave = function() {
            return sitecues.emit('badge/leave', badge.element);
        };

        findAndInitBadge();

        if (SC_UNIT) {
            // todo: maybe export the whole module instead if every single function?
            exports.badge = badge;
        }

        // Unless callback() is queued, the module is not registered in global var modules{}
        // See: https://fecru.ai2.at/cru/EQJS-39#c187
        //      https://equinox.atlassian.net/browse/EQ-355
        callback();
    });

});
