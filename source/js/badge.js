sitecues.def('badge', function(badge, callback) {

    'use strict';

    // use jquery, we can rid off this dependency
    // if we will start using vanilla js functions
    sitecues.use('jquery', 'panel', 'html-build', function($, panel, htmlBuild) {

        // This property is used when a site wants to use an existing element as a badge, rather than the standard sitecues one.
        var BADGE_ID = 'sitecues-badge';

        /**
         * Creates a markup for new badge and inserts it right into the DOM.
         * @param function success
         * @returns void
         */
        function create() {
            badge.panel = htmlBuild.$div()
                .attr('id', BADGE_ID) // set element id for proper styling
            .addClass('sitecues-badge')
                .hide()
                .appendTo('html');
            // create badge image inside of panel
            badge.element = $('<img>')
                .attr('id', 'sitecues-badge-image')
                .addClass('sitecues-badge-image')
                .attr('src', sitecues.resolveSitecuesUrl('../images/eq360-badge.png'))
                .appendTo(badge.panel);
        }

        /**
         * Shows the badge, if possible.  Uses siteUI and defaultUI settings.
         *
         * @param success Function executed if successful.
         * @return void
         */
        function show() {
            $(badge.panel)
                .css('display', 'block')
                .effects({
                        opacity: 1.0
                    }, 750, null,
                    function() {
                        sitecues.emit('badge/show');
                    });
        }

        // BODY
        var $badge = $('#' + BADGE_ID);

        if ($badge.length) {
            $badge.css({
                'visibility': 'visible',
                'opacity': 1
            });
            badge.panel = $badge;
            badge.element = badge.panel;
        } else {
            // We have no alternate or pre-existing badges defined, so create a new one.
            create();
        }

        panel.parent = badge.element;

        var setDefaultEventOver = function() {
            return sitecues.emit('badge/hover', badge.element);
        };

        var setDefaultEventLeave = function() {
            return sitecues.emit('badge/leave', badge.element);
        };

        $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave);

        show();

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
