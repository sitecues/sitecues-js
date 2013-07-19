// This module adds some JQuery-based resize helpers.
sitecues.def('jquery/resize', function (module, callback, log) {
  sitecues.use('jquery', function (jq) {

    // Add an event that fire only at the end of window resizing, not for each
    // resize event that results from dragging.
    var lastResizeEventEpoch = new Date(1, 1, 2000, 12, 0, 0).getTime()
    , timeoutSet = false
    , delta = 100
    ;

    var checkResizeEnd = function() {
      if (((+ new Date()) - lastResizeEventEpoch) < delta) {
        setTimeout(checkResizeEnd, delta);
      } else {
        timeoutSet = false;
        jq(window).trigger('resizeEnd');
      }

      sitecues.emit('resize/end');
    };


    var onEachResize = function() {
      lastResizeEventEpoch = (+ new Date());
      if (timeoutSet === false) {
        timeoutSet = true;
        setTimeout(checkResizeEnd, delta);
      }
    };

    jq(window).resize(onEachResize);

    callback();
  });
});
