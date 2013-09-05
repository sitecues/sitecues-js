/* 
 * This is the minimum package of what each testing file will need.
 * AK: I take out this code to a separate file so that we didn't duplicate it.
 * Instead, we just require the current file like: required('path/to/bootstrap')
 * It is a quick-n-dirty solution and we might want to improve it in the future.
 */

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
node = document.createElement("p");
node.setAttribute("id", "sitecues");
document.getElementsByTagName('body')[0].appendChild(node);

// Override/mock sitecues object.
var def = function(name, callback) {
  var module = {};
  var cb = function() {};
  return callback(module, cb);
};

sitecues = {
  'def': def,
  'use': function(name, callback){ return callback(jquery); },
  'tdd': true // this prop helps to use 'exports' object only under nodejs.
};
