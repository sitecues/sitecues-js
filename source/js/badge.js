sitecues.def('badge', function (badge, callback) {

  'use strict';

  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use('jquery', 'conf', 'panel', 'util/common', 'html-build', function ($, conf, panel, common, htmlBuild) {

    // This property is used when a site wants to use an existing element as a badge, rather than the standard sitecues one.
    badge.altBadges = $(conf.get('panelDisplaySelector'));
    badge.badgeId   = conf.get('badgeId');

    if (!badge.badgeId) {
      // Use the default value
      badge.badgeId = 'sitecues-badge';
    }

    function isFloatingBadge() {
      return badge.panel.parent().is(document.documentElement);
    }

    /**
   * Creates a markup for new badge and inserts it right into the DOM.
   * @param function success
   * @returns void
   */
    function create() {
      badge.panel = htmlBuild.$div()
              .attr('id', badge.badgeId) // set element id for proper styling
              .addClass('sitecues-badge')
              .hide()
              .appendTo('html');
      // create badge image inside of panel
      badge.element = $('<img>')
       .attr('id', 'sitecues-badge-image')
       .addClass('sitecues-badge-image')
       .attr('src', sitecues.resolveSitecuesUrl('../images/eq360-badge.png'))
       .appendTo(badge.panel);

      refreshBadgeSize();
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
        .effects({ opacity : 1.0 }, 750, null,
          function() {
            sitecues.emit('badge/show');
          });
    }

    function refreshBadgeSize() {
      if (isFloatingBadge()) {
        badge.panel.css({
          transformOrigin: '0% 0%',
          transform: 'scale(' + 1 / conf.get('zoom') + ')'
        });
      }
    }

    // BODY
    var $badge = $('#' + badge.badgeId);
    var isBadgeInDom = $badge && $badge.length > 0;

    if (badge.altBadges && (badge.altBadges.length > 0)) {
      badge.panel   = badge.altBadges;
      badge.element = badge.panel;
    } else if (isBadgeInDom) {
      $badge.css({'visibility': 'visible', 'opacity': 1});
      badge.panel   = $badge;
      badge.element = badge.panel;
    } else {
      // We have no alternate or pre-existing badges defined, so create a new one.
      create();
    }

    panel.parent  = badge.element;

    // Update state.
    $badge = $('#' + badge.badgeId);

    var setDefaultEventOver = function () {
      return sitecues.emit('badge/hover', badge.element);
    };     
  
    var setDefaultEventLeave = function () {
      return sitecues.emit('badge/leave', badge.element);
    };  

    $(badge.panel).hover(setDefaultEventOver, setDefaultEventLeave);

    show();

    sitecues.on('zoom', refreshBadgeSize);

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