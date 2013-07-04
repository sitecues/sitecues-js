sitecues.def('toolbar/dropdown', function(dropdown, callback, log){
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
        var dropdownLink = $('<a class="dropdown-toggle" data-toggle="dropdown" href="#"><span>sitecues</span></a>').appendTo(dropdown.wrap);
        var dropdownMenu = $('<ul class="dropdown-menu" role="menu"></ul>').appendTo(dropdown.wrap);
        $('<li><a href="#">Get Help</a></li>').appendTo(dropdownMenu);
        $('<li><a href="#">Provide feedback</a></li>').appendTo(dropdownMenu);
        $('<li><a rel="sitecues-event" data-sitecues-event="inverse/toggle">Change page colors</a></li>').appendTo(dropdownMenu);
        // EQ-699: Disable 'Turn Off' temporarily
        // $('<li><a rel="sitecues-event" data-sitecues-event="toolbar/disable">Turn off</a></li>').appendTo(dropdownMenu);
        dropdown.updateFontSize(toolbar);
        return;
      }

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