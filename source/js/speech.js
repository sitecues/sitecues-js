/**
 * This is the "main" speech library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 */

eqnx.def('speech', function(speech, callback) {

    eqnx.use('conf', 'conf/remote', function(conf, conf_remote) {

        eqnx.use('jquery', 'util/common', 'speech/azure', 'speech/ivona', function(_jQuery, common, _azure, _ivona) {

            var players = {};
            var azure = _azure;
            var ivona = _ivona;
            var jQuery=_jQuery;

            // console.log(robovoice);
            // TTS is disabled by default
            var ttsEnable = conf.get("ttsEnable") === 'true';

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
                var hlbId = speech.getHlbId(hlb);
                if(!hlbId) {
                    console.log("No hightlightbox ID!");
                    return;
                }
                //TODO While HLB is a singleton, let's clear out any other players
                speech.destroyAll();

                console.log("Initializing player for " + hlbId);
                var player = speech.factory(hlb);
                if(!player) {
                    console.log("Factory failed to create a player");
                }
                players[hlbId] = player;
                return player;
            }

            speech.factory = function(hlb) {
                // This isn't optimal, but we're not going to have so many engines that this will get unwieldy anytime soon
                if (ttsEngine === "azure") {
                   return azure.factory(hlb);
                } else if (ttsEngine === "ivona") {
                   return ivona.factory(hlb);
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
                var hlbId = speech.getHlbId(hlb);
                if(!hlbId) {
                    console.log("No hightlightbox ID!");
                    return;
                }
                var player = players[hlbId];
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
                var hlbId = speech.getHlbId(hlb);
                if(!hlbId) {
                    console.log("No hightlightbox ID!");
                    return;
                }
                console.log("Stopping " + hlbId);
                var player = players[hlbId];
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
                    if(value) {
                        setTimeout(value.stop(),5);
                    }
                });
            }

            /*
             * Iterates through all of the players and destroys them.
             */
            speech.destroyAll = function() {
                console.log("Destroying all players");
                jQuery.each(players, function(key, value) {
                    if(value) {
                        setTimeout(value.destroy(),5);
                    }
                    players[key] = null;
                });
            }

            /*
             * Enables TTS, invokes callback with no args
             */
            speech.enable = function(callback) {
                if (ttsEngine) {
                    // An engine is set so we can enable the component
                    ttsEnable = true;
                    if(common.getCookie("vCSp")) {
                        speech.say(conf.getLS('verbalCueSpeechOn'));
                    } else {
                        speech.say(conf.getLS('verbalCueSpeechOnFirst'), function() {
                            common.setCookie("vCSp","1",7);
                        });
                    }
                    if (callback) {
                        callback();
                    }
                }
                console.log("tts enabled");
            }

            /*
             * Disables TTS and stops all players, invokes callback with no args.
             */
            speech.disable = function(callback) {
                speech.stopAll();
                speech.say(conf.getLS('verbalCueSpeechOff'));
                ttsEnable = false;
                if (callback) {
                    callback();
                }
                console.log("tts disabled");
            }

            /*
             * Uses a provisional player to say a piece of text, used for visual cues.
             */
            speech.say = function(text, callback) {
                var provHlb = jQuery('<div></div>').hide().appendTo('body').text(text);
                speech.play(provHlb);
                if (callback) {
                    callback();
                }
            }

            /**
             * Returns the ID of the object.  If no ID is found, it will set a random one.
             */
            speech.getHlbId = function(hlb) {
                if(!hlb) {
                    console.log("No hlb!");
                    return;
                }
                if(hlb instanceof jQuery) {
                    if(!hlb.attr("id")) {
                        hlb.attr("id", Math.round((Math.random() + new Date().getTime()) * 1000));
                    }
                    return hlb.attr("id");
                }
                // Not a jQuery object
                if(!hlb.id) {
                    hlb.id = Math.round((Math.random() + new Date().getTime() * 1000));
                }
                return hlb.id
            }

            /**
             * Returns if TTS is enabled or not.  Always returns true or false.
             */
            speech.isEnabled = function() {
                if(ttsEnable) {
                    return true;
                }
                return false;
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
            eqnx.on('hlb/create', speech.initPlayer);

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
    });

    // end
    callback();
});
