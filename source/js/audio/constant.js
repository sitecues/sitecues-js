define(
  [],
  function () {
    // TODO add more trigger types, e.g. shift+arrow, shift+space
    var TRIGGER_TYPES = {
      LENS: 'space',
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
      TRIGGER_TYPES: TRIGGER_TYPES,
      REROUTE_NETWORK_SPEECH_KEY : '-sc-reroute-network-tts-',
      AVAILABLE_CUES : {'en': 1},
      speechStrategy : speechStrategy,
      // jshint -W117
      autoStrategy : SC_AUTO_SPEECH || speechStrategy.PREFER_NETWORK
    };
  }
);
