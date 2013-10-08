/*
 * Sitecues: hosts.js
 *
 * This is the default dev configuration which defines the host endpoints for
 * needed services in dev envs.
 *
 */
(function(){
  //// Do not change anything below this line ////////////////////////////////
  window.sitecues = window.sitecues || {};
  window.sitecues.libConfig = window.sitecues.libConfig || {};
  //// Do not change anything above this line ////////////////////////////////

  // Set hosts in the lib config object
  window.sitecues.libConfig.hosts = {
    up : "up.local.sitecues.com",
    ws : "ws.local.sitecues.com"
  };
})();
