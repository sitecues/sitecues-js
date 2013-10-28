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
    var htmlEntityMap = ['%C2%A9', '%26', '%25', '%E2%84%A2', '%3C', '%3E', '%C2%AE', '%C2%A2', '%C2%A3', '%C2%A5','%E2%82%AC','%C2%A7'];
    //@param URIComponent accepts a string of URI encoded text and removes any
    //html entity encoded characters from it
    return function (URIComponent) {
      for (var i = 0, len = htmlEntityMap.length; i < len; i++) {
        URIComponent = URIComponent.replace(htmlEntityMap[i], '');
      }
      return URIComponent;
    };
  
  }()),

  //What audio format will we use? 
  audioFormat =  (function () {
    var a = new Audio();
    if (!!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))) {
      return 'ogg';
    }
    if (!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))) {
      return 'mp3';
    }
  }()),
  
  IvonaPlayer = function(_hlb, _siteId, $, secure) {
    
    var secureFlag = (secure ? 1 : 0),
        hlb = $(_hlb),
        speechKey = hlb.data('speechKey'),
        baseMediaUrl,
        audioElement;
    
    if (speechKey) {
      baseMediaUrl = "//" + sitecues.getLibraryConfig().hosts.ws + "/sitecues/cues/ivona/" + speechKey + "." + audioFormat;
    } else {
      baseMediaUrl = "//" + sitecues.getLibraryConfig().hosts.ws
        // The "p=1" parameter specifies that the WS server should proxy the audio file (proxying is disabled by default).
        + "/sitecues/api/2/ivona/" + _siteId + "/speechfile?p=1&contentType=text/plain&secure=" + secureFlag
        + "&text=" + removeHTMLEntities(encodeURIComponent(hlb.text())) + "&codecId=" + audioFormat;
    }

    this.init = function () {

      if (audioElement) {
        return; //never create more than one <audio>
      }
                 
      audioElement = new Audio();
      audioElement.src = baseMediaUrl;
      
      $(audioElement).on('canplay', function () { //native event for <audio>
        sitecues.emit('canplay');
      });

    };

    this.play = function () {

      if (audioElement && audioElement.readyState === 4) { // enough data available to start playing
        audioElement.play();
      } else { // not enough data to start playing, so listen for the even that is fired when this is not the case
        sitecues.on('canplay', function () {
          this.play();  
        }, this);
      }

    };

    this.stop = function () {
      if (audioElement && audioElement.readyState === 4) {
        audioElement.pause();
        audioElement.currentTime = 0;
      } else {
        audioElement = undefined;
      }
    };

    this.destroy = function () {
      if (audioElement) {
        this.stop();
        sitecues.off('canplay');
        audioElement = undefined;
      }
    };

  };

  sitecues.use('jquery', 'conf/site', function ($, site) {

    ivona.factory = function(hlb) {
      log.info(hlb);
      if ($(hlb).text().length) {
        var player = new IvonaPlayer(hlb, site.get('site_id'), $, sitecues.getLibraryUrl().secure);
        player.init();
        return player;
      }
    };

    if (sitecues.tdd) {
      exports.ivona = ivona;
      exports.removeHTMLEntities = removeHTMLEntities;
    }
  
  });
  // end
  callback();
});
