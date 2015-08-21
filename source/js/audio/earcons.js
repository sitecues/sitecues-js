/**
 * This is the earcon library.  It listens to sitecues events and plays appropriate earcons.
 */

define(['audio/audio'], function(conf, audio) {

  'use strict';

  function playResetEarcon() {
    audio.playEarcon('quit-organ');
  }

  /*
   * Play reset earcon if sitecues is being reset
   */
  sitecues.on('sitecues/do-reset', playResetEarcon);

});

