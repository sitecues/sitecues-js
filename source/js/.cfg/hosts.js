/*
 * Sitecues: hosts.js
 * 
 * This is the default dev configuration which defines the host endpoints for
 * needed services in dev envs.
 *
 */ 

(function(){

  // Set hosts in the hosts object

  var hosts = {

    up : "up.sitecues.com",
    
    ws : "ws.sitecues.com"

  };

  //// Do not change anything below this line ////////////////////////////////

  if (! window.sitecues){

    window.sitecues = { coreConfig: { hosts: hosts } };

  } else {

    window.sitecues.coreConfig = { hosts: hosts };

  }

})();
