/* 
 * This is the minimum package of what each testing file will need.
 * AK: I take out this code to a separate file so that we didn't duplicate it.
 * Instead, we just require the current file like: required('path/to/bootstrap')
 * It is a quick-n-dirty solution and we might want to improve it in the future.
 */
require('./libs');
require('../data/w3c');

// Create & insert a new element we will later use for tests.
var node = document.createElement("p");
node.setAttribute("id", "sitecues");
document.getElementsByTagName('body')[0].appendChild(node);

require('../data/sitecues');
