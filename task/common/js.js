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
  bundleIncludesSourcesMap = {}, // Store the array of source files used in each bundle
  requirejs = require('requirejs'),
  config = require('../build-config'),
  size = config.isShowingSizes && require('gulp-size'),
  path = require('path'),
  pkgDir = require('pkg-dir'),
  Promise_ = require('bluebird'),   // TODO update bamboo to use node 3+ and remove this polyfill dependency
  amdConfigs = require('./amd-config'),
  absoluteSourceFolder,
  absoluteSourceFolderStringLength,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  compileFunctionMap = getCompileFunctionMap();

// Convert to relative paths and remove .js extension
function convertAbsolutePathToRequireJsName(absolutePath) {
  return absolutePath.substring(absoluteSourceFolderStringLength, absolutePath.length - 3);
}

function onModuleBundleComplete(data) {
  // Record bundle info so we can use it in amd loader config
  bundleIncludesSourcesMap[data.name] = data.included;
}

function validate(callback) {
  var sourceIncludedByBundleMap = {}, // Store the bundle for each module
    errors = [];

  amdConfigs.bundleFolders.forEach(function(sourceFolder) {
    var includedInBundle = bundleIncludesSourcesMap[sourceFolder],
      bundlePath = sourceFolder + '/',
      bundlePathLength = bundlePath.length;

    includedInBundle.forEach(function(includedItemAbsPath) {
      // Get relative path
      var includedItem = convertAbsolutePathToRequireJsName(includedItemAbsPath);

      // Check for sources outside of the bundle's folder
      if (includedItem !== sourceFolder && includedItem.substring(0, bundlePathLength) !== bundlePath) {
        errors.push('The module ' + includedItem + ' was not in it\'s bundle\'s folder ' + sourceFolder + '/.\n');
      }

      // Check for duplicated source (same source file included in multiple bundles)
      if (sourceIncludedByBundleMap[includedItem]) {
        errors.push('The module ' + includedItem + ' was included both in ' + sourceIncludedByBundleMap[includedItem] + ' and ' + sourceFolder + '.\n' +
          'Source modules must only be included once in order to avoid code duplication.');
      }
      sourceIncludedByBundleMap[includedItem] = sourceFolder;
    });
  });

  if (errors.length) {
    console.log('JS validation errors:\n' + errors);
  }

  callback(errors.length && errors);
}

function optimize(amdConfig) {
  return new Promise_(
    function(resolve, reject) {
      requirejs.optimize(
        amdConfig,
        resolve,
        reject
      );
    });
}

// Create source folder compilation function map, e.g.
// {
//   'bp-expanded': function() { /* compiles bp-expanded */ }
//   ...
// }
function getCompileFunctionMap() {
  var functionMap = {};
  amdConfigs.sourceFolders.forEach(function(sourceFolder) {
    var fn = function () {
      var amdConfig = amdConfigs.getAmdConfig(sourceFolder);
      amdConfig.onModuleBundleComplete = onModuleBundleComplete;
      return optimize(amdConfig);
    };
    fn.displayName = sourceFolder;
    functionMap[JS_SOURCE_DIR + '/' + sourceFolder] = fn;
  });

  return functionMap;
}

function prepareValidation() {
  return pkgDir(__dirname)
    .then(
      function(appRoot) {
        absoluteSourceFolder = path.join(appRoot, config.librarySourceDir, 'js') + path.sep;
        absoluteSourceFolderStringLength = absoluteSourceFolder.length;
      });
}

function showSizes() {
  return gulp.src(config.buildDir + '/**/*.js')
    .pipe(size({ pretty: true, gzip: true, showFiles: true }));
}

module.exports = {
  showSizes: showSizes,
  prepareValidation: prepareValidation,
  validate: validate,
  compileFunctionMap: compileFunctionMap
};
