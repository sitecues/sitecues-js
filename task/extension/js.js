/**
 * 1. Create bundle.js files for bundles, e.g. bp-expanded.js -- each bundle can contain multiple sources
 * 2. Move over other orphaned .js files that are not included in a bundle but are used individually
 * All .js gets the rjs namespacing treatment (sitecues.define, etc.) and is minified if the config. isMinifying option is set.
 * Definitions:
 * - Source: a small individual .js source file
 * - Bundle: a compiled bundle .js file
 * @type {Gulp|*|exports|module.exports}
 */

'use strict';

var gulp = require('gulp'),
  requirejs = require('requirejs'),
  config = require('../build-config'),
  amdConfig = require('./amd-config'),
  size = config.isShowingSizes && require('gulp-size'),
  Promise_ = require('bluebird'),   // TODO update bamboo to use node 3+ and remove this polyfill dependency
  uglify = require('gulp-uglify'),
  compileFunctionMap = getCompileFunctionMap();

function getCompileFunctionMap() {
  var functionMap = {};

  functionMap[config.librarySourceDir] = optimizeLibrary;
  functionMap[config.extensionSourceDir] = copyExtensionScripts;
  functionMap['node_modules/almond/almond.js'] = copyAlmond;

  return functionMap;
}

function optimizeLibrary() {
  return new Promise_(
    function(resolve, reject) {
      requirejs.optimize(
        amdConfig,
        resolve,
        reject
      );
    });
}
function showSizes() {
  return gulp.src(config.buildDir + '/**/*.js')
    .pipe(size({ pretty: true, gzip: true, showFiles: true }));
}

function noop(callback) {
  return callback();
}

function copyScripts(glob) {
  var src = gulp.src(glob),
    finalSrc = config.isMinifying ? src.pipe(uglify()) : src;
  return finalSrc.pipe(gulp.dest(config.resourceDir + '/js'));
}

function copyExtensionScripts() {
  return copyScripts(config.extensionSourceDir + '/js/**/*.js');
}

function copyAlmond() {
  return copyScripts('node_modules/almond/almond.js');
}

module.exports = {
  showSizes: showSizes,
  prepareValidation: noop,
  validate: noop, // TODO validate extension
  compileFunctionMap: compileFunctionMap
};
