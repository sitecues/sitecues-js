sitecues.def('toolbar/dropdown', function(dropdown, callback){
    sitecues.use( 'jquery', function ( $) {

      /**
       * We're not going to do this automatically as we need to make sure the toolbar is on the page to set up the
       * listeners properly. Otherwise we'd have to set the .on() methods to document scope which would be a
       * performance hit.
       * 
       * @return void
       */
      dropdown.build = function(parent) {

        var dropdownLink = $('<div class="sitecues-dropdown" rel="sitecues-main"><a>sitecues</a></div>').prependTo(parent);
        var menu = $('<div id="sitecues-main" class="sitecues-menu"><ul><li>Link 1</li><li>Link 2</li></div>').appendTo(parent);

        $('.sitecues-dropdown').on({
          click: function() {
            alert('foo');
          }, 
          mouseenter: function() {
            var self = $(this);
            var menu = dropdown.getMenu(self.attr('rel'));
            if(!menu) {
              return;
            }
            menu.data('sitecues-dropdown', self);
            menu.css('top',($('.sitecues-toolbar').height() + 3) + 'px');
            menu.fadeIn();
            self.data('sitecues-hover',true);
          },
          mouseleave: function() {
            var menu = dropdown.getMenu($(this).attr('rel'));
            if(!menu) {
              return;
            }
            $(this).data('sitecues-hover',false);
            setTimeout(function() { dropdown.closeMenu(menu) }, 500);
          }
        });

        $('.sitecues-menu').on({
          mouseenter: function() {
            $(this).data('sitecues-hover',true);
          },
          mouseleave: function() {
            var self = $(this);
            self.data('sitecues-hover',false);
            setTimeout(function() { dropdown.closeMenu(self); }, 500);
          }
        });

      }

      dropdown.getMenu = function(rel) {
        var menu = $('#' + rel);
        if(menu.length != 1) {
          console.log(menu.length  + 'menus for #' + $(this).attr('rel'));
          return false;
        }
        return menu;
      }

      dropdown.closeMenu = function(menu) {
        if(!menu.data('sitecues-hover') && !menu.data('sitecues-dropdown').data('sitecues-hover')) {
          menu.fadeOut();
        }
      }

    });
  callback();
});