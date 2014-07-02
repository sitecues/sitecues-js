// The general, floating close button.
sitecues.def('util/close-button', function (closeButton, callback) {
  // Define dependency modules.
  sitecues.use('jquery', function ($) {

    closeButton.create = function(onClk) {
      var onClick = onClk || null;
      var instance = {};
      var enabled = false;

      var element = $('<div>').attr('id', 'sitecues-close-button').hide().prependTo('html').click(function(e) {
        e.stopPropagation();
        instance.disable();
        if (onClick) {
          onClick(e);
        }
      });

      instance.dimensions = function() {
        return {
          width  : element.outerWidth(),
          height : element.outerHeight()
        }
      };

      instance.disable = function() {
        if (enabled) {
          element.hide();
          enabled = false;
        }
      };

      instance.position = function(left, top) {
        element.css({
          left: left,
          top: top
        });
      };

      instance.enable = function(left, top) {
        if (!enabled) {
          if (left !== undefined) {
            instance.position(left, top);
          }
          element.show();
          enabled = true;
        }
      };

      return instance;
    };

    callback();
  })
});
