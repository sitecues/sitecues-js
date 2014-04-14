/*
 * Sitecues: siteppicker.js
 * EQ-1349 - Use temporary workaround for site/picker customizations
 */
(function(){
  //// Do not change anything below this line ////////////////////////////////
  window.sitecues = window.sitecues || {};
  window.sitecues.libConfig = window.sitecues.libConfig || {};
  //// Do not change anything above this line ////////////////////////////////

  // Set hosts in the lib config object
  window.sitecues.libConfig.sitepickermods = {
    eeoc_gov        : true,
    scotiabank_com  : true,
    cnib_ca         : true,
    texasat_net     : true,
    calstate_edu    : true,
  };
})();