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
      speechStrategy: speechStrategy,
      autoStrategy : speechStrategy.PREFER_NETWORK
    };
  }
);
