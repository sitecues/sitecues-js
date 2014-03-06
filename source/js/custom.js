/**
 * Custom.js - Please make sure this remains the first script after core.js in the build process
 */
sitecues.def('custom', function (custom, callback, log) {
  
  'use strict';

  custom.registry = {};
  
  custom.register = function (customScript) {

    var module = customScript.module;

    // Create a object for the module you want to customize if it does not exist
    if (!custom.registry[module]) {
      custom.registry[module] = {};
    }

    var registryEntry = custom.registry[module][customScript.customId] = {};

    registryEntry.module = customScript.module;
    registryEntry.func = customScript.func;

  };

  // Checks if there are fixes for a module,and executes their fix functions with the module's scope
  custom.check = function (moduleName) {
    // The scope of 'this' with the custom.check function is the module being passed via call()
    // from the callback in core.js's _def function

    var module = custom.registry[moduleName];

    if (module) {
      for (var customId in module) {
        module[customId].func.call(this);
      }
    }

  };

  // Done.
  callback();

});