// Override/mock sitecues object.
var blankFunction = function() {};
// Initialize.
sitecues = {'def': blankFunction,
            'use': blankFunction,
            'on' : blankFunction,
            'off': blankFunction,
            'emit': blankFunction,
            'tdd': true}; // this prop helps to use 'exports' object only under nodejs.

/**
 * Check if it the existing module and hence is not expected to be loaded.
 * For now we only care about jquery.
 * Potentially, there might be more modules we do not want to load from 'data' folder.
 * @param {type} name
 * @returns {Boolean} true if there is a module with this name; false if this is a path.
 */
var isExistingModule = function(name) {
  return name.toString() === 'jquery';
}

// Define the expected behavior when necessary.
var def = function(name, callback, log) {
  var module = {};
  var cb = function() {};
  var log = {'info': function() {}};
  return callback(module, cb, log);
};

use = function() {
  var args = [];
  var index = 0;

  // Look over the parameters. For ex., 'jquery', 'conf', 'cursor/style' etc.
  while (index < arguments.length - 1) {
    var module;
    // Add the module if it is already loaded.
    if (isExistingModule(arguments[index])) {
      module = jquery;
      args.push(module);
    } else {
      // Otherwise, load the module from /data folder and execute it.
      var name = arguments[index].split('/');
      module = require('../data/modules/' + arguments[index]);
      args.push(eval(name[name.length - 1]));
    }
    index++;
  }

  var callback = arguments[arguments.length - 1];
  return callback.apply(this, args);
};

// Now stub the functions we need.
sinon.stub(sitecues, 'def', def);
sinon.stub(sitecues, 'use', use);

