var swdda = require("swdda")
  , extend	= require('node.extend')
  ;

// We will be modifying and returning the original SWDDA module.
exports = module.exports = swdda;

// Constants.
var	TEST_SITE_DEFAULTS = {
  hostname	: "localhost",
  siteId		: 1,
  httpPort	: 8000,
  httpsPort	: 8443,
  secure		: false
};

var SITECUES_URL_DEFAULTS = {
  hostname	: "localhost",
  path		: "/js/equinox.js",
  httpPort	: 8000,
  httpsPort	: 8443
};

// Current configuration.
var configuration = swdda.getConfiguration();

// Combine the test site data with the defaults.
configuration.testSite = extend(true, {}, TEST_SITE_DEFAULTS, configuration.testSite);

// Combine the sitecues URL data with the defaults
configuration.sitecuesUrl = extend(true, {}, SITECUES_URL_DEFAULTS, configuration.sitecuesUrl);

// Helper method used to create test URLs.
function generateUrl(config) {
  return 'http' + ( config.secure ? 's' : '' ) + '://'
    + config.hostname + ':' + ( config.secure ? config.httpsPort : config.httpPort )
    + config.path
}

// Helper method used to generate test URLs from configuration.
swdda.testUrl = function(testSite) {
  if (typeof testSite === 'string') {
    testSite = { path: testSite };
  }
  testSite = extend(true, {}, configuration.testSite, testSite);
  var sitecuesUrl = extend(true, {}, configuration.sitecuesUrl, { secure: testSite.secure });

  var qIndex = testSite.path.indexOf('?');
  var scjsurlParam = ( qIndex < 0 ? '?' : ( qIndex == (testSite.path.length - 1 ? '' : '&' ) ) ) + 'scjsurl=';

  return generateUrl(testSite)
    + scjsurlParam + encodeURIComponent(generateUrl(sitecuesUrl))
    + '&scwsid=' + encodeURIComponent(testSite.siteId);
};
