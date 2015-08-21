/**
 * Custom.js - Please make sure this remains the first script after core.js in the build process
 * This is used for custom builds on a per-website/customer basis. See custom-scripts/
 */
require([], function() {
  
  'use strict';

  var customIndex = 0;

  var registry = {};

  var custom = this;
  
  function register(moduleName, script) {

    // Create a object for the module you want to customize if it does not exist
    if (!custom.registry[moduleName]) {
     registry[moduleName] = {};
    }

    var registryEntry = registry[moduleName][customIndex] = {};

    customIndex++;

    registryEntry.module = moduleName;
    registryEntry.func = script;

  }

  // Checks if there are fixes for a module,and executes their fix functions with the module's scope
  function check(moduleName) {
    // The scope of 'this' with thecheck function is the module being passed via call()
    // from the callback in core.js's _def function

    var module = registry[moduleName];

    if (module) {
      for (var customIndex in module) {
        if (module.hasOwnProperty(customIndex)) {
          module[customIndex].func.call(custom);
        }
      }
    }

  }

  var publics = {
    register: register,
    check: check
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
