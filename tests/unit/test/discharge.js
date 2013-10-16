/* 
 * This file aims to unload variables(objects & fakes) we create in boostrap.js
 */

// #1 Libs: Unload module from nodejs's cache
var name = require.resolve('sinon');
delete require.cache[name];

var name = require.resolve('chai');
delete require.cache[name];

var name = require.resolve('jquery');
delete require.cache[name];

var name = require.resolve('jsdom');
delete require.cache[name];

var name = require.resolve('sinon');
delete require.cache[name];

// #2 Custom node modules: Unload module from nodejs's cache
var name = require('./libs');
delete require.cache[name];

var name = require('../data/w3c');
delete require.cache[name];

var name = require.resolve('../data/sitecues');
delete require.cache[name];

var name = require.resolve('../test/bootstrap');
delete require.cache[name];

