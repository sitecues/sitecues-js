sitecues.def('toolbar/dropdown', function(dropdown, callback, log){
    
    var kTextHelp = 'Help';
    var kTextFeedback = 'Provide feedback';
    var kTextChangeColors = 'Change page colors';
    var kTextTurnOff = 'Turn off';

    sitecues.use('jquery', 'toolbar/bootstrap-dropdown', function ($, bootstrapDropdown) {
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
        var dropdownLink = $('<a class="dropdown-toggle" data-toggle="dropdown" href="#"><span>sitecues</span></a>').appendTo(dropdown.wrap);
        var dropdownMenu = $('<ul class="dropdown-menu" role="menu"></ul>').appendTo(dropdown.wrap);
        $('<li><a id="sitecues_help_show" href="#">'+ kTextHelp +'</a></li>').appendTo(dropdownMenu).on('click', function() {
          console.log("SHOW HELP.");
          sitecues.emit('help/show', {});
        });
        $('<li><a target="_blank" href="https://www.surveymonkey.com/s/MRQLLBF">'+ kTextFeedback +'</a></li>').appendTo(dropdownMenu);
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
      };

      sitecues.on("toolbar/resized", dropdown.updateFontSize);

      callback();
    });
});