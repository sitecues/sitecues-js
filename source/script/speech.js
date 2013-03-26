/**
 * This is the "main" speech library.  It manages all of the events 
 * and requests and should be the only speech component referenced 
 * by other parts of the application.
 */

eqnx.def('speech', function(speech, callback) {

    eqnx.use('jquery', 'conf', 'util', 'speech/azure', function(_jQuery, conf, util, _azure) {
      
        var players = {};
        var azure = _azure;
        var jQuery=_jQuery;

        // console.log(robovoice);
        // TTS is enabled by default
        var ttsEnable = !(conf.get("ttsEnable") == 'false');

        // This is the engine we're using, required, no default
        var ttsEngine = conf.get("ttsEngine");

        if (!ttsEngine) {
            // No engine was set so the whole component is disabled.
            ttsEnable = false;
        }

        console.log("ttsEnable: " + ttsEnable);
        console.log("ttsEngine: " + ttsEngine);

        /*
         * The module loading is async so we're doing this setup as a callback to when the configured player is actually loaded.
         */
        speech.initPlayer = function(hlb) {
            if (!ttsEnable) {
                console.log("TTS is disabled");
                return;
            }
            if(!hlb || !hlb.attr("id")) {
                console.log("No hlb ID!");
                return;
            }
            
            //TODO While HLB is a singleton, let's clear out any other players
            speech.stopAll();

            console.log("Initializing player for " + hlb.attr("id"));
            var player = speech.factory(hlb);
            if(!player) {
                console.log("Factory failed to create a player");
            }
            players[hlb.attr("id")] = player;
            return player;
        }

        speech.factory = function(hlb) {
            // This isn't optimal, but we're not going to have so many engines that this will get unwieldy anytime soon
            if (ttsEngine === "azure") {
                    return azure.factory(hlb);
            } else {
                // No matching plugins, disable TTS
                console.log("No engine configured!");
                ttsEnable = false;
            }
        }

        /*
         * Play any piece of text.
         *
         * Note: When we start splitting text, that should happen in here 
         * as it may be implementation-specific.
         */
        speech.play = function(hlb) {
            if (!ttsEnable) {
                console.log("TTS is disabled");
                return;
            }
            if(!hlb || !hlb.attr("id")) {
                console.log("No hlb ID!");
                return;
            }
            var player = players[hlb.attr("id")];
            if(!player) {
                // A player wasn't initialized, so let's do that now
                console.log("Lazy init of player");
                player = speech.initPlayer(hlb);
            }
            player.play();
        }

        /*
         * Stops the player that is attached to a highlight box.
         * This is safe to call if the player has not been initialized
         * or is not playing.
         */
        speech.stop = function(hlb) {
            if(!hlb || !hlb.attr("id")) {
                console.log("No hlb ID!");
                return;
            }
            console.log("Stopping " + hlb.attr("id"));
            var player = players[hlb.attr("id")];
            if(player) {
                player.stop();
            } else {
                console.log(players);
            }
        }

        /*
         * Iterates through all of the players and stops them.
         */
        speech.stopAll = function() {
            console.log("Stopping all players");
            jQuery.each(players, function(key, value) {
                setTimeout(value.stop(),5);
            });
        }

        /*
         * Enables TTS, invokes callback with no args
         */
        speech.enable = function(callback) {
            if (ttsEngine) {
                // An engine is set so we can enable the component
                ttsEnable = true;
                if (callback) {
                    callback();
                }
            }
        }

        /*
         * Disables TTS and stops all players, invokes callback with no args.
         */
        speech.disable = function(callback) {
            ttsEnable = false;
            speech.stopAll();
            if (callback) {
                callback();
            }
        }

        /*
         * Enables TTS, if possible.
         */
        eqnx.on('speech/enable', speech.enable);

        /*
         * Disable TTS, terminating all players.
         */
        eqnx.on('speech/disable', speech.disable);

        /*
         * Stop playback of all TTS.
         */
        eqnx.on('speech/stop', speech.stopAll);

        /*
         * A highlight box has been requested.  This will create the player 
         * if necessary, but will not play anything.
         */
        eqnx.on('hlb/created', speech.initPlayer);
        
        /*
         * A highlight box is ready to play.  If no player has been initialized,
         * this will do that first and then begin playing.
         */
        eqnx.on('hlb/ready', speech.play);

        /*
         * A highlight box was closed.  Stop/abort/dispose of the player 
         * attached to it.
         */
        eqnx.on('hlb/closed', speech.stop);
        
    });

    // end
    callback();

});
