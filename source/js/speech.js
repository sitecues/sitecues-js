/**
 * This is the "main" speech library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 */

sitecues.def('speech', function (speech, callback, log) {
  
  'use strict';
  
  speech.CONSTANTS = {
    // Tracks if the user has heard the longer, more descriptive "speech on" cue.
    'FIRST_SPEECH_ON_PARAM'      : 'firstSpeechOn',
    // Time in millis after which the more descriptive "speech on" cue should replay.
    'FIRST_SPEECH_ON_RESET_MS'   : 7 * 86400000, // 7 days
    'SITE_TTS_ENABLE_PARAM'      : 'siteTTSEnable',
    // Used to define if "Speech off" cue needs to be said.
    'SPEECH_OFF_PARAM'           : 'speechOff',
    'VERBAL_CUE_SPEECH_ON'       : 'verbalCueSpeechOn',
    'VERBAL_CUE_SPEECH_ON_FIRST' : 'verbalCueSpeechOnFirst',
    'VERBAL_CUE_SPEECH_OFF'      : 'verbalCueSpeechOff'

  };
  
  sitecues.use('conf', 'conf/site', 'jquery', 'platform', function(conf, site, $, platform) {

    var players = {},
        // Use the site and user settings, if available, but if neither is
        // available, we'll fall back to being disabled
        ttsEnable = !(conf.get('ttsEnable') === undefined && conf.get('siteTTSEnable') === undefined)
                    && (conf.get('ttsEnable') === undefined || conf.get('ttsEnable'))
                    && (conf.get('siteTTSEnable') === undefined || conf.get('siteTTSEnable')),
       /*
        * This is a flag we can set that will effectively enable TTS, but
        * not interfere with the user state maintained in the ttsEnable
        * variable.  The primary intent here is for use by cue()
       */
        ttsBypass = false,
        // This is the engine we're using, required, no default
        ttsEngine = site.get('ttsEngine'),

        timesCued = 0,
        maxCued = 3,

        /**
         * Returns true if the "first speech on" cue should be played.
         * @return {boolean}
         */
        shouldPlayFirstSpeechOnCue = function() {

          var fso = conf.get(speech.CONSTANTS.FIRST_SPEECH_ON_PARAM);
          return (!fso || ((fso + speech.CONSTANTS.FIRST_SPEECH_ON_RESET_MS) < (new Date()).getTime()));
        },
        /**
         * Returns true if the "speech off" cue should be played.
         * @return {boolean}
         */
        shouldPlaySpeechOffCue = function() {
          return conf.get(speech.CONSTANTS.SPEECH_OFF_PARAM);
        },
        /**
         * Signals that the "first speech on" cue has played.
         */
        playedFirstSpeechOnCue = function() {
          conf.set(speech.CONSTANTS.FIRST_SPEECH_ON_PARAM, (new Date()).getTime());
        },

        //What audio format will we use? 
        audioFormat =  (function () {

          try {
            var a = new Audio();
            //Default to ogg if it's supported, otherwise, mp3
            if (!!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))) {
              return 'ogg';
            }
            if (!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))) {
              return 'mp3';
            }
          } catch (e) {
            if (platform.browser.isChrome || platform.browser.isFirefox) {
              return 'ogg';
            } else {
              return 'mp3';
            }        
          }
        
        }()),

        NotSafariAudioPlayer = function(hlb, siteId, secure) {
          
          var secureFlag = (secure ? 1 : 0),
              speechKey = hlb.data('speechKey'),
              baseMediaUrl,
              audioElement,
              playing = false;
              //startTime = (new Date).getTime() / 1000;
          
          if (speechKey) {
            baseMediaUrl = '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/cues/ivona/' + speechKey + '.' + audioFormat;
          } else {
            baseMediaUrl = '//' + sitecues.getLibraryConfig().hosts.ws
              // The "p=1" parameter specifies that the WS server should proxy the audio file (proxying is disabled by default).
              + '/sitecues/api/2/ivona/' + siteId + '/speechfile?p=1&contentType=text/plain&secure=' + secureFlag
              + '&text=' + encodeURIComponent(hlb.text()) + '&codecId=' + audioFormat;
          }

          this.init = function () {

            if (audioElement) {
              return; //never create more than one <audio>
            }
                       
            audioElement = new Audio();
            audioElement.src = baseMediaUrl;  //fetches the resource
            
            $(audioElement).on('canplay', function () { //native event for <audio>
              sitecues.emit('canplay'); //custom event required for unpredictable timing
            });

          };




          this.play = function () {
            //console.log( shouldPlayFirstSpeechOnCue(), shouldPlaySpeechOffCue(), playedFirstSpeechOnCue() )
            if (audioElement) {
              if (audioElement.readyState >= 3 && !playing) { // enough data available to start playing
                playing = true;
                //console.log((new Date).getTime() / 1000  - startTime);
                audioElement.play();
              } else { // not enough data to start playing, so listen for the even that is fired when this is not the case
                sitecues.on('canplay', function () {
                  this.play();  
                }, this);
              }
            }

          };

          this.stop = function () {
                        //console.log( shouldPlayFirstSpeechOnCue(), shouldPlaySpeechOffCue(), playedFirstSpeechOnCue() )

            sitecues.off('canplay');
            
            if (audioElement && audioElement.readyState >= 3) {
              //audioElement has been initiated and the response has come
              //back and audio is ready to play.  We want to just pause it
              //and configure it so that if we want we can start playing the 
              //audio again without making another request
              audioElement.pause();
              audioElement.currentTime = 0;
              playing = false;
            
            } else {
              //audioElement has been initiated, but the request hasnt completed.
              //We need to make sure it does not play at all. This happens if the
              //HLB opens and closes before the request comes back
              audioElement = undefined;
            }
          };

          this.destroy = function () {
            if (audioElement) {
              this.stop();
              audioElement = undefined;             
            }
          };

        },
        
        //Using an immediately invoking function that returns 
        //a function to contain all logic needed for playing audio
        //in Safari in case we want to separate this into its own module.
        SafariAudioPlayer = (function () {  
          //Best practice is to use a single audio context per window.
          var context = typeof AudioContext !== 'undefined' ? new AudioContext() :
                        typeof webkitAudioContext !== 'undefined' ? new webkitAudioContext() :
                        undefined,
              volumeNode;        
          
          return function(hlb, siteId, secure) {
            
            var secureFlag = (secure ? 1 : 0),
                speechKey = hlb.data('speechKey'),
                baseMediaUrl;
                //startTime = (new Date).getTime() / 1000;
            
            if (!volumeNode) {
              volumeNode = context.createGainNode();
              volumeNode.gain.value = 1;
            }

            if (speechKey) {
              baseMediaUrl = '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/cues/ivona/' + speechKey + '.' + audioFormat;
            } else {
              baseMediaUrl = '//' + sitecues.getLibraryConfig().hosts.ws
                // The "p=1" parameter specifies that the WS server should proxy the audio file (proxying is disabled by default).
                + '/sitecues/api/2/ivona/' + siteId + '/speechfile?p=1&contentType=text/plain&secure=' + secureFlag
                + '&text=' + encodeURIComponent(hlb.text()) + '&codecId=' + audioFormat;
            }

            this.soundSource = undefined;

            this.init = function () {

              var that = this, //required for ajax callback
                  request = new XMLHttpRequest();
              //create a buffer containing the binary data that the Web Audio API uses
              that.soundSource = context.createBufferSource();
              //Connect the source to the node that controls volume
              this.soundSource.connect(volumeNode);
              //Connect the volume node to the output
              volumeNode.connect(context.destination);
            
              request.open('GET', baseMediaUrl, true);
              
              request.responseType = 'arraybuffer';
              // Our asynchronous callback
              request.onload = function() { 
                //Asynchronously decodes the audio file data contained in the ArrayBuffer.
                context.decodeAudioData(request.response, function (buffer) {
                  
                  if (that.soundSource && !that.soundSource.buffer) {
                    that.soundSource.buffer = buffer;
                    sitecues.emit('audioReady');
                  }
                
                });
              
              };
              
              request.send();
            
            };

            this.play = function () {

              if (this.soundSource.buffer) {

                //console.log((new Date).getTime() / 1000 - startTime);
                //Play from beginning of audio file
                this.soundSource.noteOn(0);
                
              } else {
                sitecues.on('audioReady', this.play, this);
              }
            };

            this.stop = function () {
              sitecues.off('audioReady');
              if (this.soundSource.buffer) {
                this.soundSource.noteOff(context.currentTime);
              }
            };

            this.destroy = function () {
              this.stop();
              this.soundSource = undefined;
            };

          };

        }()),

        AudioPlayer = platform.browser.is === 'Safari' ? SafariAudioPlayer : NotSafariAudioPlayer;
      
      /*if (platform.browser.is === 'Safari') {
        console.log('Using Safari Player');
      } else {
        console.log('Using <audio> Player');
      }*/
      //end variable declarations 
   
    log.warn('siteTTSEnable for ' + window.location.host + ': ' + conf.get('siteTTSEnable'));
    
    if (!ttsEngine) {
      // No engine was set so the whole component is disabled.
      ttsEnable = false;
    }

    /*
     * The module loading is async so we're doing this setup as a callback to when the configured player is actually loaded.
     */
    speech.initPlayer = function(hlb, hlbOptions) {

      if (!ttsEnable && !ttsBypass) {
        log.info('TTS is disabled');
        return null;
      }

      if (hlbOptions && hlbOptions.suppress_tts) {
        log.info('HLB disabled TTS for this content');
        return null;
      }
      //TODO While HLB is a singleton, let's clear out any other players
      speech.destroyAll();

      var hlbId = speech.getHlbId(hlb),
          player = speech.factory(hlb);

      if(!hlbId) {
        log.warn('No hightlightbox ID!');
        return null;
      }


      log.info('Initializing player for ' + hlbId);
      
      if(!player) {
        log.warn('Factory failed to create a player');
      }

      players[hlbId] = player;
      
      return player;
    
    };

    speech.factory = function(hlb) {
      // This isn't optimal, but we're not going to have so many engines that this will get unwieldy anytime soon
      if (ttsEngine) {
        if ($(hlb).text().length || $(hlb).data('speechKey')) {
          var player = new AudioPlayer($(hlb), site.get('site_id'), sitecues.getLibraryUrl().secure);
          player.init();
          return player;
        }
      } else {
        // No matching plugins, disable TTS
        log.warn('No engine configured!');
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
        log.info('TTS is disabled');
        return false;
      }

      if (hlbOptions && hlbOptions.suppress_tts) {
        log.info('TTS is disabled');
        return false;
      }

      var hlbId = speech.getHlbId(hlb),
          player = players[hlbId];
  
      if (!hlbId) {
        log.warn('No hightlightbox ID!');
        return false;
      }
  
      if (!player) {
        // A player wasn't initialized, so let's do that now
        log.info('Lazy init of player');
        player = speech.initPlayer(hlb, hlbOptions);
      }
      if (player) {
        player.play();
      } else {
        log.warn('No player with which to play');          
      }
      // Stop speech on any key down.
      $(window).on('keydown', function() {
        speech.stop(hlb);
      });
      
      return true;
    
    };

    /*
     * Stops the player that is attached to a highlight box.
     * This is safe to call if the player has not been initialized
     * or is not playing.
     */
    speech.stop = function(hlb) {

      var hlbId = speech.getHlbId(hlb),
          player = players[hlbId];
      
      if (!hlbId) {
        log.warn('No hightlightbox ID!');
        return;
      }
      
      log.info('Stopping ' + hlbId);

      if (player) {
        player.stop();
      } else {
        log.info(players);
      }
      //Remove hanlder of stoping speech on any key down.
      $(window).off('keydown', function() {
        speech.stop(hlb);
      });
    
    };
    /*
     * Iterates through all of the players and stops them.
     */
    speech.stopAll = function() {
      
      log.info('Stopping all players');
      
      $.each(players, function(key, value) {
        if (value) {
          //setTimeout(value.stop, 5);
          value.stop();
        }
      });
    
    };

    /*
     * Iterates through all of the players and destroys them.
     */
    speech.destroyAll = function() {
      
      log.info('Destroying all players');
      
      $.each(players, function(key, value) {
        if (value) {
          //setTimeout(value.destroy, 5);
          value.destroy();
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
        conf.set(speech.CONSTANTS.SITE_TTS_ENABLE_PARAM, true);
        conf.set(speech.CONSTANTS.SPEECH_OFF_PARAM, true);


         // EQ-996 - As a user, I want multiple chances to learn about the 
         // spacebar command so that I can benefit from One Touch Read 
         //---------------------------------------------------------------------------------------------------//
         // 1) For the TTS-spacebar hint (currently given when TTS is turned on the first time):
         // Give the hint max three times, or until the user successfully uses the spacebar once with TTS on.
         speech.timesCued = timesCued++;

        if(!shouldPlayFirstSpeechOnCue()) {
          speech.sayByKey(speech.CONSTANTS.VERBAL_CUE_SPEECH_ON);
        } else {
          speech.sayByKey(speech.CONSTANTS.VERBAL_CUE_SPEECH_ON_FIRST, function() {

                    if( speech.timesCued == maxCued ){
                      playedFirstSpeechOnCue();
                    }
          });
        }
        if (callback) {
          callback();
        }
      }
      log.info('tts enabled');
      sitecues.emit('speech/enabled');
    };

    /*
     * Disables TTS and stops all players, invokes callback with no args.
     */
    speech.disable = function(callback) {
      speech.stopAll();
      conf.set(speech.CONSTANTS.SITE_TTS_ENABLE_PARAM, false);
      if (shouldPlaySpeechOffCue()) {
        speech.sayByKey(speech.CONSTANTS.VERBAL_CUE_SPEECH_OFF);
      }
      ttsEnable = false;
      if (callback) {
        callback();
      }
      log.info('tts disabled');
      sitecues.emit('speech/disabled');
    };

    /*
     * Uses a provisional player to say a piece of text, used for visual cues.
     */
    speech.say = function(text, callback) {
      var provHlb = $('<div></div>').hide().appendTo('body').text(text);
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
      var provHlb = $('<div></div>').hide().appendTo('body').data('speechKey', key);
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
        log.info('No hlb!');
        return;
      }
      if (hlb instanceof $) {
        if(!hlb.attr('id')) {
          hlb.attr('id', Math.round((Math.random() + new Date().getTime()) * 1000));
        }
        return hlb.attr('id');
      }
      // Not a jQuery object
      if (!hlb.id) {
        hlb.id = Math.round((Math.random() + new Date().getTime() * 1000));
      }
      return hlb.id;
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
