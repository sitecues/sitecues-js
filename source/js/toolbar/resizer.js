sitecues.def('toolbar/resizer', function(resizer, callback){
    sitecues.use( 'jquery', 'conf', 'util/hammer', function ($, conf, hammer) {

      /**
       * We're not going to do this automatically as we need to make sure the toolbar is on the page to set up the
       * listeners properly. Otherwise we'd have to set the .on() methods to document scope which would be a
       * performance hit.
       * 
       * @return void
       */
      resizer.build = function(toolbar, shim) {

        resizer.toolbar = toolbar;
        resizer.shim = shim;

        resizer.element = $('<div class="sitecues-resizer"></div>').appendTo(resizer.toolbar);
        var resizerDrag = Hammer(resizer.element.get(0));

        // I'm not thrilled with the way this text-select-avoidance works,
        // but it seems pretty good.  We don't really want to attach a
        // hammer to the body because that causes an unnecessary
        // performance hit and could interfere with an existing hammer if
        // it's already there.
        resizer.element.mouseenter(function() {
            $('body').addClass('noselect');
        }).mouseleave(function() {
            if(!resizer.element.data('dragging')) {
                $('body').removeClass('noselect');
            }
        });

        resizerDrag.on('dragstart', function(e) {
            resizer.element.data('dragging', true);
        });
        resizerDrag.on('drag', function(e) {
            resizer.element.data('dragging', true);
            e.gesture.preventDefault();
            e.stopPropagation();
            resizer.resize(e);
        });
        // Save the height when we're done dragging
        resizerDrag.on('dragend', function(e) {
            resizer.saveHeight();
            resizer.element.data('dragging', false);
            $('body').removeClass('noselect');
        });
      }


      resizer.resize = function(e) {
          if(!e.gesture || e.gesture.touches.length != 1) {
              // Ignore on multitouch
              return;
          }
          var height = e.gesture.touches[0].pageY;
          if(height < 20) {
              height = 20;
          } else if (height > 60) {
              height = 60;
          }
          resizer.toolbar.css({
              height: height
          });
          resizer.shim.css({
              height: height
          });
      }


      resizer.saveHeight = function() {
          conf.set('toolbarHeight', resizer.toolbar.height());
      }

      callback();

    });
});