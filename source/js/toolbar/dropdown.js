sitecues.def('toolbar/dropdown', function(dropdown, callback){
    sitecues.use( 'jquery', 'toolbar/bootstrap-dropdown', function ($, bootstrapDropdown) {
      /**
       * We're not going to do this automatically as we need to make sure the toolbar is on the page to set up the
       * listeners properly. Otherwise we'd have to set the .on() methods to document scope which would be a
       * performance hit.
       * 
       * @return void
       */
      dropdown.build = function(parent) {

        var dropdownWrap = $('<div class="dropdown-wrap"></div>').prependTo(parent);
        var dropdownLink = $('<a class="dropdown-toggle" data-toggle="dropdown" href="#"><span>sitecues</span></a>').appendTo(dropdownWrap);
        var dropdownMenu = $('<ul class="dropdown-menu" role="menu"></ul>').appendTo(dropdownWrap);
        $('<li><a href="#">Get Help</a></li>').appendTo(dropdownMenu);
        $('<li><a href="#">Provide feedback</a></li>').appendTo(dropdownMenu);
        $('<li><a rel="sitecues-event" data-sitecues-event="inverse/toggle">Change page colors</a></li>').appendTo(dropdownMenu);
        $('<li><a rel="sitecues-event" data-sitecues-event="toolbar/disable">Turn off</a></li>').appendTo(dropdownMenu);

        return;
      }

    });

  callback();
});