/**
 * This is the library that deals with the Ivona TTS service.
 * At the moment it is incomplete as we're not exactly sure
 * how we will implement Ivona's API.  This version is therefore
 * a generic audio file player.
 */
sitecues.def('speech/ivona', function (ivona, callback, log) {
  //Fix for EQ-498 - Translate hex representation of html entities to words
  var removeHTMLEntities = (function() {
    //©, &, %, ™, <, >,  ®, ¢,  £, ¥, €, § (most common?)
    //Taken from http://www.w3schools.com/tags/ref_entities.asp and then passed the symbols above into
    //the native function encodeURIComponent.  Example: encodeURIComponent('®')
    var htmlEntityMap = ['%C2%A9', '%26', '%25', '%E2%84%A2', '%3C', '%3E', '%C2%AE', '%A2', '%A3', '%C2%A5','%E2%82%AC','%C2%A7'];
    //@param URIComponent accepts a string of URI encoded text and removes any
    //html entity encoded characters from it
    return function (URIComponent) {
      for (var i = 0, len = htmlEntityMap.length; i < len; i++) {
        URIComponent = URIComponent.replace(htmlEntityMap[i], '');
      }
      return URIComponent;
    }
  
  }());

  var IvonaPlayer = function(_hlb, _conf, _jQuery, _secure) {
    var myState = 'init';
    var secureFlag = (_secure ? 1 : 0);
    var hlb = _jQuery(_hlb);

    var speechKey = hlb.data('speechKey');
    var baseMediaUrl, mp3Url, oggUrl;

    if (speechKey) {
      baseMediaUrl = "//" + sitecues.getCoreConfig().hosts.ws + "/equinox/cues/ivona/" + speechKey + ".";
      mp3Url = baseMediaUrl + "mp3";
      oggUrl = baseMediaUrl + "ogg";
    } else {
      baseMediaUrl = "//" + sitecues.getCoreConfig().hosts.ws
        // TODO: Remove the hard-coded site ID.
        + "/equinox/api/ivona/5/speechfile?contentType=text/plain&secure=" + secureFlag
        + "&text=" + removeHTMLEntities(encodeURIComponent(hlb.text())) + "&codecId=";
      mp3Url = baseMediaUrl + "mp3";
      oggUrl = baseMediaUrl + "ogg";
    }

    this.init = function() {
      _jQuery("body").append(_jQuery('<div id="jPlayer-' + hlb.attr('id')  + '" class="jPlayerControl"></div>'));
      log.info(_jQuery("#jPlayer-" + hlb.attr('id')));
      _jQuery("#jPlayer-" + hlb.attr('id')).jPlayer({
        ready: function() {
          log.info("jPlayer Ready");
          _jQuery(this).jPlayer( "setMedia", {
            mp3: mp3Url,
            oga: oggUrl
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
    };

    if (sitecues.tdd) {
      exports.ivona = ivona;
      exports.removeHTMLEntities = removeHTMLEntities;
    }
  
  });
  // end
  callback();
});
