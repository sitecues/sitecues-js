sitecues.def('badge', function (badge, callback, log) {
  // use jquery, we can rid off this dependency
  // if we will start using vanilla js functions
  sitecues.use('jquery', 'conf', 'panel', 'ui', function ($, conf, panel) {

    // This property is used when a site wants to use an existing element as a badge, rather than the standard sitecues one.
    badge.altBadges = $(conf.get('panelDisplaySelector'));
    badge.badgeId   = conf.get('badgeId');

    if (! badge.badgeId) {
      // Use the default value
      badge.badgeId = 'sitecues-badge';
    }

    if (badge.altBadges && (badge.altBadges.length > 0)) {
      badge.panel   = badge.altBadges;
      badge.element = badge.panel;
      panel.parent  = badge.element;
    } else if ($('#' + badge.badgeId).length > 0) {
      badge.panel   = $('#' + badge.badgeId);
      badge.element = badge.panel;
      panel.parent  = badge.element;
    } else {
      // We have no alternate or pre-existing badges defined, so create a new one.
      badge.panel = $('<div>');

      $(badge.panel).attr('id', badge.badgeId) // set element id for proper styling
                    .addClass('sitecues-badge')
                    .hide()
                    .appendTo('html');

      // create badge image inside of panel
      badge.element = $('<img>');

      $(badge.element).attr('id', 'sitecues-badge-image')
                      .addClass('sitecues-badge-image')
                      .attr('src', sitecues.resolveSitecuesUrl('../images/eq360-badge.png'))
                      .appendTo(badge.panel);
    }

    $(badge.panel).hover(function () {
      sitecues.emit('badge/hover', badge.element); // emit event about hover
    }, function () {
      sitecues.emit('badge/leave', badge.element); // emit event about leave
    });

    $(badge.panel).on("click", function () {
      sitecues.emit('badge/click', badge.element); // emit event about badge click
    });

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
    badge.show = function (success) {
    	if(conf.get('badgeEnabled')) {
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
     * Closes the badge and sets the preference so it stays closed.
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

      sitecues.on("badge/enable", function() {
          badge.enable(true);
      });

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});