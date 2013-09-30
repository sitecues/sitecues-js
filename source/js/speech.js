/**
 * This is the "main" speech library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 */

sitecues.def('speech', function (speech, callback, log) {

  // Tracks if the user has heard the longer, more descriptive "speech on" cue.
  var FIRST_SPEECH_ON_PARAM = 'firstSpeechOn';
  // Time in millis after which the more descriptive "speech on" cue should replay.
  var FIRST_SPEECH_ON_RESET_MS = 7 * 86400000; // 7 days
  var SITE_TTS_ENABLE_PARAM = 'siteTTSEnable';
  // Used to define if "Speech off" cue needs to be said.
  var SPEECH_OFF_PARAM = 'speechOff';

  var VERBAL_CUE_SPEECH_ON = 'verbalCueSpeechOn';
  var VERBAL_CUE_SPEECH_ON_FIRST = 'verbalCueSpeechOnFirst';
  var VERBAL_CUE_SPEECH_OFF = 'verbalCueSpeechOff';

  sitecues.use('conf', function(conf) {

    sitecues.use('jquery', 'speech/azure', 'speech/ivona', function(_jQuery, _azure, _ivona) {

      var players = {};
      var azure = _azure;
      var ivona = _ivona;
      var jQuery=_jQuery;

      // Use the site and user settings, if available, but if neither is
      // available, we'll fall back to being disabled
      var ttsEnable = !(conf.get("ttsEnable") === undefined && conf.get("siteTTSEnable") === undefined)
      && (conf.get("ttsEnable") === undefined || conf.get("ttsEnable"))
      && (conf.get("siteTTSEnable") === undefined || conf.get("siteTTSEnable"));
      log.warn('siteTTSEnable for ' + window.location.host + ': ' + conf.get("siteTTSEnable"));

      /*
       * This is a flag we can set that will effectively enable TTS, but
       * not interfere with the user state maintained in the ttsEnable
       * variable.  The primary intent here is for use by cue()
       */
      var ttsBypass = false;

      // This is the engine we're using, required, no default
      var ttsEngine = conf.get("ttsEngine");

      if (!ttsEngine) {
        // No engine was set so the whole component is disabled.
        ttsEnable = false;
      }

      /*
       * The module loading is async so we're doing this setup as a callback to when the configured player is actually loaded.
       */
      speech.initPlayer = function(hlb, hlbOptions) {

        if (!ttsEnable && !ttsBypass) {
          log.info("TTS is disabled");
          return null;
        }

        if (hlbOptions && hlbOptions.suppress_tts) {
          log.info("HLB disabled TTS for this content");
          return null;
        }

        var hlbId = speech.getHlbId(hlb);
        if(!hlbId) {
          log.warn("No hightlightbox ID!");
          return null;
        }
        //TODO While HLB is a singleton, let's clear out any other players
        speech.destroyAll();

        log.info("Initializing player for " + hlbId);
        var player = speech.factory(hlb);
        if(!player) {
          log.warn("Factory failed to create a player");
        }
        players[hlbId] = player;
        return player;
      };

      speech.factory = function(hlb) {
        // This isn't optimal, but we're not going to have so many engines that this will get unwieldy anytime soon
        if (ttsEngine === "azure") {
         return azure.factory(hlb);
        } else if (ttsEngine === "ivona") {
         return ivona.factory(hlb);
        } else {
          // No matching plugins, disable TTS
          log.warn("No engine configured!");
          ttsEnable = false;
        }
      };

      /*
       * Play any piece of text.
       *
       * Note: When we start splitting text, that should happen in here
       * as it may be implementation-specific.
       *
       * @return true if something was played, or false if there was an error or nothing to play.
       */
      speech.play = function(hlb, hlbOptions) {
        if (!ttsEnable && !ttsBypass) {
          log.info("TTS is disabled");
          return false;
        }

        if (hlbOptions && hlbOptions.suppress_tts) {
          log.info("TTS is disabled");
          return false;
        }

        var hlbId = speech.getHlbId(hlb);
        if (!hlbId) {
          log.warn("No hightlightbox ID!");
          return false;
        }
        var player = players[hlbId];
        if (!player) {
          // A player wasn't initialized, so let's do that now
          log.info("Lazy init of player");
          player = speech.initPlayer(hlb, hlbOptions);
        }
        if (player) {
          player.play();
        } else {
          log.warn("No player with which to play");          
        }
        // Stop speech on any key down.
        jQuery(window).on('keydown', function() {
         speech.stop(hlb);
        });
        return true;
      };

      /*
       * Stops the player that is attached to a highlight box.
       * This is safe to call if the player has not been initialized
       * or is not playing.
       */
      speech.stop = function(hlb, hlbOptions) {
        var hlbId = speech.getHlbId(hlb);
        if (!hlbId) {
          log.warn("No hightlightbox ID!");
          return;
        }
        log.info("Stopping " + hlbId);
        var player = players[hlbId];
        if (player) {
          player.stop();
        } else {
          log.info(players);
        }
        //Remove hanlder of stoping speech on any key down.
        jQuery(window).off('keydown', function() {
         speech.stop(hlb);
        });
      };

      /*
       * Iterates through all of the players and stops them.
       */
      speech.stopAll = function() {
        log.info("Stopping all players");
        jQuery.each(players, function(key, value) {
          if(value) {
            setTimeout(value.stop,5);
          }
        });
      };

      /*
       * Iterates through all of the players and destroys them.
       */
      speech.destroyAll = function() {
        log.info("Destroying all players");
        jQuery.each(players, function(key, value) {
          if(value) {
            setTimeout(value.destroy,5);
          }
          players[key] = null;
        });
      };

      /*
       * Enables TTS, invokes callback with no args
       */
      speech.enable = function(callback) {
        if (ttsEngine) {
          // An engine is set so we can enable the component
          ttsEnable = true;
          conf.set(SITE_TTS_ENABLE_PARAM, true);
          conf.set(SPEECH_OFF_PARAM, true);

          if(!shouldPlayFirstSpeechOnCue()) {
            speech.sayByKey(VERBAL_CUE_SPEECH_ON);
          } else {
            speech.sayByKey(VERBAL_CUE_SPEECH_ON_FIRST, function() {
            playedFirstSpeechOnCue();
            });
          }
          if (callback) {
            callback();
          }
        }
        log.info("tts enabled");
        sitecues.emit('speech/enabled');
      };

      /*
       * Disables TTS and stops all players, invokes callback with no args.
       */
      speech.disable = function(callback) {
        speech.stopAll();
        conf.set(SITE_TTS_ENABLE_PARAM, false);
        if (shouldPlaySpeechOffCue()) {
          speech.sayByKey(VERBAL_CUE_SPEECH_OFF);
        }
        ttsEnable = false;
        if (callback) {
          callback();
        }
        log.info("tts disabled");
        sitecues.emit('speech/disabled');
      };

      /*
       * Uses a provisional player to say a piece of text, used for visual cues.
       */
      speech.say = function(text, callback) {
        var provHlb = jQuery('<div></div>').hide().appendTo('body').text(text);
        if (speech.play(provHlb) && callback) {
          callback();
        }
      };

      /*
       * Uses a provisional player to say a piece of text by key, used for visual cues.
       */
      speech.sayByKey = function(key, callback) {
        // MONKEY PATCH!!! Our TTS is very HLB-centric at the moment, so how this works is as follows:
        // Create a div for the audio file, but instead of containing text, add a property to the DOM
        // object that indicates what the key is. The speech processor will use that key to determine
        // the audio file, rather than using the text.
        var provHlb = jQuery('<div></div>').hide().appendTo('body').data('speechKey', key);
        if (speech.play(provHlb) && callback) {
          callback();
        }
      };

      /*
       * A variant of say() that will work even if speech is disabled.
       */
      speech.cue = function(text, callback) {
        ttsBypass = true;
        speech.say(text, callback);
        ttsBypass = false;
      };

      /*
       * A variant of cue() that plays audio by key rather than supplied text.
       */
      speech.cueByKey = function(key, callback) {
        ttsBypass = true;
        speech.sayByKey(key, callback);
        ttsBypass = false;
      };

      /**
       * Returns the ID of the object.  If no ID is found, it will set a random one.
       */
      speech.getHlbId = function(hlb) {
        if (!hlb) {
          log.info("No hlb!");
          return;
        }
        if (hlb instanceof jQuery) {
          if(!hlb.attr("id")) {
            hlb.attr("id", Math.round((Math.random() + new Date().getTime()) * 1000));
          }
          return hlb.attr("id");
        }
        // Not a jQuery object
        if (!hlb.id) {
          hlb.id = Math.round((Math.random() + new Date().getTime() * 1000));
        }
        return hlb.id
      };

      /**
       * Returns if TTS is enabled or not.  Always returns true or false.
       */
      speech.isEnabled = function() {
        return !!ttsEnable;
      };

      /**
       * Toggles speech on or off based on its current state.
       */
      speech.toggle = function() {
        if (speech.isEnabled()) {
          sitecues.emit('speech/disable');
        } else {
          sitecues.emit('speech/enable');
        }
      };

      /**
       * Returns true if the "first speech on" cue should be played.
       * @return {boolean}
       */
      var shouldPlayFirstSpeechOnCue = function() {
        var fso = conf.get(FIRST_SPEECH_ON_PARAM);
        return (!fso || ((fso + FIRST_SPEECH_ON_RESET_MS) < (new Date()).getTime()));
      };

      /**
       * Returns true if the "speech off" cue should be played.
       * @return {boolean}
       */
      var shouldPlaySpeechOffCue = function() {
        return conf.get(SPEECH_OFF_PARAM);
      };

      /**
       * Signals that the "first speech on" cue has played.
       */
      var playedFirstSpeechOnCue = function() {
        conf.set(FIRST_SPEECH_ON_PARAM, (new Date()).getTime());
      };

      /*
       * Enables TTS, if possible.
       */
      sitecues.on('speech/enable', speech.enable);

      /*
       * Enables TTS, if possible.
       */
      sitecues.on('speech/toggle', speech.toggle);

      /*
       * Disable TTS, terminating all players.
       */
      sitecues.on('speech/disable', speech.disable);

      /*
       * Stop playback of all TTS.
       */
      sitecues.on('speech/stop', speech.stopAll);

      /*
       * A highlight box has been requested.  This will create the player
       * if necessary, but will not play anything.
       */
      sitecues.on('hlb/create', speech.initPlayer);

      /*
       * A highlight box is ready to play.  If no player has been initialized,
       * this will do that first and then begin playing.
       */
      sitecues.on('hlb/ready', speech.play);

      /*
       * A highlight box was closed.  Stop/abort/dispose of the player
       * attached to it.
       */
      sitecues.on('hlb/closed', speech.stop);

      // end
      callback();

    });
  });
});
