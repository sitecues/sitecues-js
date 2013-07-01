// This module contains helper methods to be used in conjunction with the SWDDA TestingBot client,
var testingbot = {};
exports = module.exports = testingbot;

// See if we have been provided a name prefix via the env.
var NAME_PREFIX_VAR = 'browser.name.prefix';
var namePrefix = process.env[NAME_PREFIX_VAR];

// Add a unique prefix to the browser sessions.
testingbot.processBrowserConfig = function(browserConfig) {
  if (namePrefix) {
    browserConfig.name = namePrefix + ': ' + browserConfig.name;
  }
  return browserConfig;
};
