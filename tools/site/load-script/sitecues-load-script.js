var sitecues = window.sitecues || {};

sitecues.config = {
  site_id : 's-00000005'  // Default
  //site_id : 's-0000000a'  // Lumenvox
  //site_id : 's-0000ee0c'  // EEOC
  //site_id : 's-c27fa71d'     // Texas AT
};

var ipAddress = '10.0.3.1',
  SCRIPT_URLS = {
    localHost: 'localhost/l/s;id=__SITEID__/js/sitecues.js',
    ipAddress: '__IPADDRESS__:8888/l/s;id=__SITEID__/js/sitecues.js'.replace('__IPADDRESS__', ipAddress),
    preProduction: 'ec2-54-81-136-235.compute-1.amazonaws.com/l/s;id=__SITEID__/js/sitecues.js',
    production: 'js.sitecues.com/l/s;id=__SITEID__/js/sitecues.js',
    releaseCandidate: 'js.dev.sitecues.com/l/s;id=__SITEID__/v/release-__VERSION__/latest/js/sitecues.js',
    latestDev: 'js.dev.sitecues.com/l/s;id=__SITEID__/v/dev/latest/js/sitecues.js',
    specificDev: 'js.dev.sitecues.com/l/s;id=__SITEID__/v/dev/__VERSION__-DEV/js/sitecues.js',
    branch: 'js.dev.sitecues.com/l/s;id=__SITEID__/v/__BRANCHNAME__/latest/js/sitecues.js',
    researchBranch: 'js.rnd.sitecues.com/l/s;id=__SITEID__/__BRANCHNAME__/js/sitecues.js',
    hotfix: 'js.dev.sitecues.com/l/s;id=__SITEID__/v/hotfix-2.5-001/2.5-HF-1.2-RELEASE/js/sitecues.js'

};

(function () {
  var script = document.createElement('script'),
  first = document.getElementsByTagName('script')[0];

  var url = document.location.protocol + '//';

  // Comment out all except the one you need
  url += SCRIPT_URLS.localHost;
//  url += SCRIPT_URLS.production;
//  url += SCRIPT_URLS.releaseCandidate.replace('__VERSION__', '2.0');
//  url += SCRIPT_URLS.latestDev;
//  url += SCRIPT_URLS.specificDev.replace('__VERSION__', '2.0');
//  url += SCRIPT_URLS.branch.replace('__BRANCHNAME__', 'zoomzoom2');
//  url += SCRIPT_URLS.researchBranch.replace('__BRANCHNAME__', 'demo');
//  url += SCRIPT_URLS.hotfix;

  // Add site ID
  url = url.replace('__SITEID__', sitecues.config.site_id);

  sitecues.config.script_url = url;
  script.src = sitecues.config.script_url;
  script.type = 'text/javascript';
  script.async = true;
  first.parentNode.insertBefore(script, first);

})();
