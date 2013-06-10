/**
 * This is the library that deals with the Ivona TTS service.
 * At the moment it is incomplete as we're not exactly sure
 * how we will implement Ivona's API.  This version is therefore
 * a generic audio file player.
 */
sitecues.def('speech/ivona', function(ivona, callback) {

    var IvonaPlayer = function(_hlb, _conf, _jQuery, _secure) {
        var myState = 'init';
		var secureFlag = (_secure ? 1 : 0);
        var hlb = _jQuery(_hlb);
		// TODO: Remove the hard-coded site ID.
        var baseMediaUrl = "//" + sitecues.getCoreConfig().hosts.ws + "/equinox/api/ivona/5/speechfile?contentType=text/plain&secure=" + secureFlag + "&";
        this.init = function() {
            _jQuery("body").append(_jQuery('<div id="jPlayer-' + hlb.attr('id')  + '" class="jPlayerControl"></div>'));
            log.info(_jQuery("#jPlayer-" + hlb.attr('id')));
            _jQuery("#jPlayer-" + hlb.attr('id')).jPlayer({
                ready: function() {
                    log.info("jPlayer Ready");
                    _jQuery(this).jPlayer( "setMedia", {
                        mp3: baseMediaUrl + "codecId=mp3&text=" + encodeURIComponent(hlb.text()),
                        oga: baseMediaUrl + "codecId=ogg&text=" + encodeURIComponent(hlb.text())
                    });
                    if(myState === 'waiting') {
                        _jQuery(this).jPlayer('play');
                    } else {
                        myState = 'ready';
                    }
                },
                preload: 'auto',
                play: function() {
                    log.info("Playing");
                },
                error: function(event) {
                    log.warn("Error: via Ivona");
                    log.info(event)
                },
                supplied: "oga, mp3"
            });
            log.info(_jQuery("#jPlayer-" + hlb.attr('id')));
        };

        this.play = function() {
            log.info("Playing via ivona: " + hlb.text());
            if(myState === 'ready') {
                _jQuery("#jPlayer-" + hlb.attr('id')).jPlayer("play");
            } else {
                myState = 'waiting';
            }
            return true;
        };

        this.stop = function() {
            log.info("Stopping ivona player");
            _jQuery("#jPlayer-" + hlb.attr('id')).jPlayer("stop");
        };

        this.destroy = function() {
            log.info("Destroying ivona player");
            this.stop();
            _jQuery("#jPlayer-" + hlb.attr('id')).jPlayer("destroy");
            _jQuery("#jPlayer-" + hlb.attr('id')).remove();
        };

    };

    sitecues.use('jquery', 'conf', 'speech/jplayer', function (_jQuery, conf) {

        ivona.factory = function(hlb) {
        	log.info(hlb);
        	var player = new IvonaPlayer(hlb, conf, _jQuery, sitecues.getScriptSrcUrl().secure);
        	player.init();
        	return player;
        }
    });

    // end
    callback();
});
