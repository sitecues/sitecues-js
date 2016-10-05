define(
  [],
  function () {
    // TODO add more trigger types, e.g. shift+arrow, shift+space
    var TRIGGER_TYPES = {
      HIGHLIGHT: 'shift',
      SELECTION: 'selection'
    },
    speechStrategy = {
      AUTO    : 'auto', // Currently same as PREFER_NETWORK
      LOCAL   : 'local',
      NETWORK : 'network',
      PREFER_LOCAL : 'preferLocal',
      PREFER_NETWORK : 'preferNetwork'
    };

    return {
      AUDIO_BUSY_EVENT: 'audio/did-toggle',
      TRIGGER_TYPES: TRIGGER_TYPES,
      REROUTE_NETWORK_SPEECH_KEY : '-sc-reroute-network-tts-',
      AVAILABLE_CUES : { 'ar': 1, 'de': 1, 'en': 1, 'es': 1, 'fr': 1, 'pl': 1, 'sv': 1 },
      speechStrategy : speechStrategy,
      // jshint -W117
      autoStrategy : SC_AUTO_SPEECH || speechStrategy.PREFER_NETWORK
    };
  }
);
