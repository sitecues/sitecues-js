/**
 * Custom.js - Please make sure this remains the first script after core.js in the build process
 * This is used for custom builds on a per-website/customer basis. See custom-scripts/
 */
sitecues.def('custom', function (custom, callback) {
  
  'use strict';

  var customIndex = 0;

  custom.registry = {};
  
  custom.register = function (moduleName, script) {

    // Create a object for the module you want to customize if it does not exist
    if (!custom.registry[moduleName]) {
      custom.registry[moduleName] = {};
    }

    var registryEntry = custom.registry[moduleName][customIndex] = {};

    customIndex++;

    registryEntry.module = moduleName;
    registryEntry.func = script;

  };

  // Checks if there are fixes for a module,and executes their fix functions with the module's scope
  custom.check = function (moduleName) {
    // The scope of 'this' with the custom.check function is the module being passed via call()
    // from the callback in core.js's _def function

    var module = custom.registry[moduleName];

    if (module) {
      for (var customIndex in module) {
        module[customIndex].func.call(this);
      }
    }

  };

  // Done.
  callback();

});