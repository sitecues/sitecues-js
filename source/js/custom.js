/**
 * Custom.js
 */
sitecues.def('custom', function (custom, callback, log) {

  console.log('execute custom.js____________________________________', +new Date()/1000);

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

  
  sitecues.on('core/allModulesLoaded', function(){
    console.log('ok bro');
    console.log(this, arguments);
  })

  // Checks if there are fixes for a module,and executes their fix functions with the module's scope
  custom.check = function () {

    // The scope ot 'this' is the module being passed via call() from the bottom of the module
    var module = custom.registry[this.moduleName];

    console.log(this.moduleName);

    if (module) {
      for (var customId in module) {
        module[customId].func.call(this);
      }
    }

  };

  // Done.
  callback();

});