/**
 * This is the library that deals with the Ivona TTS service.
 * At the moment it is incomplete as we're not exactly sure
 * how we will implement Ivona's API.  This version is therefore
 * a generic audio file player.
 */
eqnx.def('speech/ivona', function(ivona, callback) {

    eqnx.use('jquery', 'conf', 'speech/jplayer', function (_jQuery, conf) {

        ivona.factory = function(hlb) {
        	console.log(hlb);
        	var player = new IvonaPlayer(hlb, conf, _jQuery);
        	player.init();
        	return player;
        }

    });

    // end
    callback();

});

function IvonaPlayer(_hlb, conf, _jQuery) {

	var myState='init';
	var hlb;
	if(hlb instanceof jQuery) {
		hlb =_hlb;
	} else {
		hlb = _jQuery(_hlb);
	}

	this.init = function() {
		_jQuery("body").append(_jQuery('<div id="jPlayer-' + hlb.attr('id')  + '" class="jPlayerControl"></div>'));
		console.log(_jQuery("#jPlayer-" + hlb.attr('id')));
	    _jQuery("#jPlayer-" + hlb.attr('id')).jPlayer({
		    ready: function() {
		    	console.log("jPlayer Ready");
			    _jQuery(this).jPlayer( "setMedia", {
					mp3: "/Def_Leppard.mp3?text=" + encodeURIComponent(hlb.text()),
					oga: "/ACDC_-_Back_In_Black-sample.ogg?text=" + encodeURIComponent(hlb.text())
			    });
			    if(myState === 'waiting') {
			    	_jQuery(this).jPlayer('play');
			    } else {
			    	myState = 'ready';
			    }
		    },
		    preload: 'auto',
		    play: function() {
		    	console.log("Playing");
		    },
		    error: function(event) {
		    	console.log("Error");
		    	console.log(event)
		    },
	    	supplied: "oga, mp3"
	    });
		console.log(_jQuery("#jPlayer-" + hlb.attr('id')));
	}
    
	this.play = function() {
		console.log("Playing via ivona: " + hlb.text());
		if(myState === 'ready') {
			_jQuery("#jPlayer-" + hlb.attr('id')).jPlayer("play");
		} else {
			myState = 'waiting';
		}
	}

	this.stop = function() {
		console.log("Stopping ivona player");
		_jQuery("#jPlayer-" + hlb.attr('id')).jPlayer("stop");
	}

	this.destroy = function() {
		console.log("Destroying ivona player");
		this.stop();
		_jQuery("#jPlayer-" + hlb.attr('id')).jPlayer("destroy");
		_jQuery("#jPlayer-" + hlb.attr('id')).remove();
	}

}