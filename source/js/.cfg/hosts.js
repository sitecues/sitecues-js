/*
 * Sitecues: hosts.js
 *
 * This is the default dev configuration which defines the host endpoints for
 * needed services in dev envs.
 *
 */
(function(){
  //// Do not change anything below this line ////////////////////////////////
  if (!window.sitecues){
    window.sitecues = {};
  }
  if (!window.sitecues.coreConfig){
    window.sitecues.coreConfig = {};
  }
  //// Do not change anything above this line ////////////////////////////////

  // Set hosts in the core config object
  window.sitecues.coreConfig.hosts = {
    up : "up.local.sitecues.com",
    ws : "ws.dev.sitecues.com"
  };
})();
