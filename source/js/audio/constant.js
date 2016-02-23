define(
  [],
  function () {
    var speechStrategy ={
        AUTO    : 'auto', // Currently same as PREFER_NETWORK
        LOCAL   : 'local',
        NETWORK : 'network',
        PREFER_LOCAL : 'preferLocal',
        PREFER_NETWORK : 'preferNetwork'
      };

    return {
      REROUTE_NETWORK_SPEECH_KEY : '-sc-reroute-network-tts-',
      AVAILABLE_CUES : {'en': 1},
      speechStrategy : speechStrategy,
      // jshint -W117
      autoStrategy : SC_AUTO_SPEECH || speechStrategy.PREFER_NETWORK
    };
  }
);
