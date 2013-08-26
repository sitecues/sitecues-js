sitecues.def('toolbar/dropdown', function(dropdown, callback, log){
    
    var kTextHelp = 'Help';
    var kTextFeedback = 'Provide Feedback';
    var kTextChangeColors = 'Change Page Colors';
    var kTextTurnOff = 'Turn Off';
    
    // Note: bootstrap dropdown is not explicitly used but this dependency is required for menu to showup.
    sitecues.use( 'jquery', 'toolbar/bootstrap-dropdown', function ($, bootstrapDropdown) {
      /**
       * We're not going to do this automatically as we need to make sure the
       * toolbar is on the page to set up the listeners properly. Otherwise
       * we'd have to set the .on() methods to document scope which would be a
       * performance hit.
       * 
       * @return void
       */
      dropdown.build = function(toolbar) {

        dropdown.wrap = $('<div class="dropdown-wrap"></div>').prependTo(toolbar);

	// Compose & insert dropdown logo element in toolbar.
	 $('<img />').attr({
	   'id':    'sitecues-logo',
	   'class': 'dropdown-toggle',
	   'data-toggle': 'dropdown',
	   'src': sitecues.resolveSitecuesUrl('../images/toolbar/toolbar-logo.png'),
	   'alt': 'sitecues' })
	.appendTo(dropdown.wrap);

	// Compose & insert dropdown menu and inner items.
        var dropdownMenu = $('<ul class="dropdown-menu" role="menu"></ul>').appendTo(dropdown.wrap);
        $('<li><a id="sitecues_help_show">'+ kTextHelp +'</a></li>')
		.appendTo(dropdownMenu)
		.on('click', function() {
		  sitecues.emit('iframe-modal/show', {name:'help'});
		});
        $('<li><a id="sitecues_feedback_show">'+ kTextFeedback +'</a></li>')
		.appendTo(dropdownMenu)
		.on('click', function() {
		  sitecues.emit('iframe-modal/show', {name:'feedback'});
		});
        //$('<li><a rel="sitecues-event" data-sitecues-event="inverse/toggle">'+ kTextChangeColors +'</a></li>').appendTo(dropdownMenu);
        $('<li><a rel="sitecues-event" data-sitecues-event="toolbar/disable">'+ kTextTurnOff +'</a></li>').appendTo(dropdownMenu);
        dropdown.updateFontSize(toolbar);
      };

      dropdown.updateFontSize = function(toolbar) {
        var fontSize = (toolbar.height() * 0.4);
        if(fontSize < 15) {
          fontSize = 15;
        }
        dropdown.wrap.css('font-size', fontSize + 'px')
      }

      sitecues.on("toolbar/resized", dropdown.updateFontSize);

      callback();
    });
});