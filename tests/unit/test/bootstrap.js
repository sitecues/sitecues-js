/* 
 * This is the minimum package of what each testing file will need.
 * AK: I take out this code to a separate file so that we didn't duplicate it.
 * Instead, we just require the current file like: required('path/to/bootstrap')
 * It is a quick-n-dirty solution and we might want to improve it in the future.
 */

// todo: we might need shutdown file wich restores all the objects & fakes we create here.
// Load the libraries we need to use.
require('./libs');

// Stub jquery plugin 'style'.
jquery.fn.style  = function() {};
var expectedBehaviour = function(property, value) {
  jquery(this).css(property, value);
};
    sinon.stub(jquery.fn, 'style', expectedBehaviour);

// Load javascript implementation of W3C and create browser objects we need:
// document, window, nodes etc.
require('../data/w3c');

// Create & insert a new element we will later use for tests.
var node = document.createElement("p");
node.setAttribute("id", "sitecues");
document.getElementsByTagName('body')[0].appendChild(node);

// Load the shim for sitecues global object.
require('../data/sitecues');
