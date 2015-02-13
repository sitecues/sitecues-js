/**
 * This is the earcon library.  It listens to sitecues events and plays appropriate earcons.
 */

sitecues.def('audio/earcons', function (earcons, callback) {

  'use strict';

  sitecues.use('audio', function(conf, audio) {

    function playResetEarcon() {
      audio.playEarcon('quit-organ');
    }

    /*
     * Play reset earcon if sitecues is being reset
     */
    sitecues.on('sitecues/do-reset', playResetEarcon);

    callback();
  });

});

