/**
 * This is the "main" speech library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 */

sitecues.def('speech', function(speech, callback) {

    sitecues.use('conf', 'conf/remote', function(conf, conf_remote) {

        sitecues.use('jquery', 'util/common', 'speech/azure', 'speech/ivona', function(_jQuery, common, _azure, _ivona) {

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
            speech.initPlayer = function(hlb) {
                if (!ttsEnable && !ttsBypass) {
                    log.info("TTS is disabled");
                    return;
                }
                var hlbId = speech.getHlbId(hlb);
                if(!hlbId) {
                    log.warn("No hightlightbox ID!");
                    return;
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
            }

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
            }

            /*
             * Play any piece of text.
             *
             * Note: When we start splitting text, that should happen in here
             * as it may be implementation-specific.
             *
             * @return true if something was played, or false if there was an error or nothing to play.
             */
            speech.play = function(hlb) {
                if (!ttsEnable && !ttsBypass) {
                    log.info("TTS is disabled");
                    return false;
                }
                var hlbId = speech.getHlbId(hlb);
                if(!hlbId) {
                    log.warn("No hightlightbox ID!");
                    return false;
                }
                var player = players[hlbId];
                if(!player) {
                    // A player wasn't initialized, so let's do that now
                    log.info("Lazy init of player");
                    player = speech.initPlayer(hlb);
                }
                player.play();
                return true;
            }

            /*
             * Stops the player that is attached to a highlight box.
             * This is safe to call if the player has not been initialized
             * or is not playing.
             */
            speech.stop = function(hlb) {
                var hlbId = speech.getHlbId(hlb);
                if(!hlbId) {
                    log.warn("No hightlightbox ID!");
                    return;
                }
                log.info("Stopping " + hlbId);
                var player = players[hlbId];
                if(player) {
                    player.stop();
                } else {
                    log.info(players);
                }
            }

            /*
             * Iterates through all of the players and stops them.
             */
            speech.stopAll = function() {
                log.info("Stopping all players");
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
                log.info("Destroying all players");
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
                    conf.set('siteTTSEnable', true);
                    if(common.getCookie("vCSp")) {
                        speech.say(conf.getLS('verbalCueSpeechOn'));
                    } else {
                        speech.say(conf.getLS('verbalCueSpeechOnFirst'), function() {
                            common.setCookie("vCSp", 1, 7);
                        });
                    }
                    if (callback) {
                        callback();
                    }
                }
                log.info("tts enabled");
            }

            /*
             * Disables TTS and stops all players, invokes callback with no args.
             */
            speech.disable = function(callback) {
                speech.stopAll();
                conf.set('siteTTSEnable', false);
                speech.say(conf.getLS('verbalCueSpeechOff'));
                ttsEnable = false;
                if (callback) {
                    callback();
                }
                log.info("tts disabled");
            }

            /*
             * Uses a provisional player to say a piece of text, used for visual cues.
             */
            speech.say = function(text, callback) {
                var provHlb = jQuery('<div></div>').hide().appendTo('body').text(text);
                if(speech.play(provHlb) && callback) {
                    callback();
                }
            }

            /*
             * A variant of say() that will work even if speech is disabled.
             */
            speech.cue = function(text, callback) {
                ttsBypass = true;
                speech.say(text, callback);
                ttsBypass = false;
            }

            /**
             * Returns the ID of the object.  If no ID is found, it will set a random one.
             */
            speech.getHlbId = function(hlb) {
                if(!hlb) {
                    log.info("No hlb!");
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
                return !!ttsEnable;
            }

            /**
             * Toggles speech on or off based on its current state.
             */
            speech.toggle = function() {
                if(speech.isEnabled()) {
                    sitecues.emit('speech/disable');
                } else {
                    sitecues.emit('speech/enable');
                }
            }

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