/* 
 * This is the minimum package of what each testing file will need.
 * AK: I take out this code to a separate file so that we didn't duplicate it.
 * Instead, we just require the current file like: required('path/to/bootstrap')
 * It is a quick-n-dirty solution and we might want to improve it in the future.
 */

// Require fixtures library.
sinon   = require("sinon");

// Require assertive library.
chai    = require("chai");
expect  = chai.expect;

// Require other libraries we need.
jquery = require("jquery");
jsdom  = require("jsdom");

// Create a basic document with empty <head> and <body> tags; DOM level 3.
document = jsdom.jsdom();
window   = document.parentWindow;

// Create & insert a new element we will later use for tests.
var node = document.createElement("p");
node.setAttribute("id", "sitecues");
document.getElementsByTagName('body')[0].appendChild(node);

//var $ = sinon.stub();
//$.withArgs(node).returns(sinon.stub({style: function(){}}));

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
