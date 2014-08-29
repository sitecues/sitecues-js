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
          $badge.hover(setDefaultEventOver, setDefaultEventLeave);
        }

        function getBadge() {
          return $('#' + BADGE_ID);
        }

        function findAndInitBadge() {
          var interval;

          function checkForBadge() {
            var $badge = getBadge();
            if ($badge.length) {
              clearInterval(interval);
              $badge.css({
                visibility: 'visible',
                opacity: 1,
                transition: 'opacity 0.6s'
              });
              setBadgeHooks($badge);
              return true;
            }
            if (document.readyState === 'complete') {
              clearInterval(interval);
              console.log('sitecues error: no sitecues badge with id="sitecues-badge" found.');
              if (SC_DEV || $('html').attr('data-sitecues-type') === 'extension') {
                createFloatingBadge();
                return true;
              }
            }
          }

          if (!checkForBadge()) {
            interval = setInterval(checkForBadge, BADGE_CHECK_INTERVAL);
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
