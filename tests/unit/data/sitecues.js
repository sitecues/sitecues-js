// Override/mock sitecues object.
var def = function(name, callback, log) {
  var module = {};
  var cb = function() {};
  var log = {'info': function() {}};
  return callback(module, cb, log);
};

use = function(name) {
  var args = [];
  var index = 0;
  while (index < arguments.length - 1) {
    var module = require('../data/modules/' + arguments[index]);
    // todo: find better way to declare sets of data.
    var name = arguments[index].split('/');
    console.log(jquery.isEmptyObject);
    args.push(jquery.isEmptyObject(module) ? eval(name[name.length - 1]) : module);
    index++;
  }

  var callback = arguments[arguments.length - 1];
  return callback.apply(this, args);
};

sitecues = {'def': def,
            'use': use,
            'on' : function() {},
            'off': function() {},
            'emit': function() {},
            'tdd': true}; // this prop helps to use 'exports' object only under nodejs.