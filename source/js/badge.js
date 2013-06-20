// module for showing equinox badge on the page
// and notifying system about interactions (hover/click)
sitecues.def('badge', function(badge, callback, log) {


	// use jquery, we can rid off this dependency
	// if we will start using vanilla js functions
	sitecues.use('jquery', 'conf', 'panel', 'ui', function($, conf, panel){

		badge.altBadges = $(conf.get('panelDisplaySelector'));

		badge.badgeId = conf.get('badgeId');
		if(!badge.badgeId) {
			// Use the default value
			badge.badgeId = 'sitecues-badge';
		}

		if(badge.altBadges && badge.altBadges.length > 0) {
			panel.parent = badge.element = badge.panel = badge.altBadges;
		} else if ($('#' + badge.badgeId).length > 0) {
			panel.parent = badge.element = badge.panel = $('#' + badge.badgeId);
		} else {
			// We have no alternate or pre-existing badges defined, so create a new one.
			badge.panel = $('<div>')
				.attr('id', badge.badgeId) // set element id for proper styling
				.addClass('sitecues-badge')
				.hide()
				.appendTo('html');


			// create badge image inside of panel
			badge.element = $('<img>')
				.attr('id', 'sitecues-badge-image')
				.addClass('sitecues-badge-image')
				.attr('src', sitecues.resolvesitecuesUrl('../images/eq360-badge.png'))
				.appendTo(badge.panel);

			// handle image loading
			badge.element.load(function(){
				// show badge panel only after image was loaded
				badge.panel.fadeIn(callback);
			});
		}

		badge.panel 
			.hover(function () {
				sitecues.emit('badge/hover', badge.element); // emit event about hover
			}, function(){
				sitecues.emit('badge/leave', badge.element); // emit event about leave
			})
			.click(function () {
				sitecues.emit('badge/click', badge.element); // emit event about badge click
			});


		// hide panel
		badge.hide = function() {
			badge.panel.fadeOut('fast');
		};

		// hide panel
		badge.show = function() {
			badge.panel.fadeIn('slow');
		};

		// Hide the badge when the toolbar displays
		sitecues.on("toolbar/state/on", function() {
			badge.hide();
		});

		sitecues.on("toolbar/state/off", function() {
			badge.show();
		});


		// Unless callback() is queued, the module is not registered in global var modules{}
		// See: https://fecru.ai2.at/cru/EQJS-39#c187
		//      https://equinox.atlassian.net/browse/EQ-355
		callback();

	});

});