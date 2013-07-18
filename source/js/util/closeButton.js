// The general, floating close button.
sitecues.def('util/closeButton', function (closeButton, callback, log) {
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

      instance.enable = function(left, top) {
        if (!enabled) {
          element.css({
            left: left,
            top: top
          }).show();
          enabled = true;
        }
      };

      return instance;
    };

    callback();
  })
});
