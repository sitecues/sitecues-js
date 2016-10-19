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
  extend = require('extend'),
  size = config.isShowingSizes && require('gulp-size'),
  path = require('path'),
  pkgDir = require('pkg-dir'),
  amdConfigs = require('./amd-config'),
  absoluteSourceFolder,
  absoluteSourceFolderStringLength,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  compileFunctionMap = getCompileFunctionMap(),
  isMin = config.isMinifying;

function getUglifyOptions() {
  return {
    compress: {
      dead_code: true,  // Remove dead code whether minifying or not
      sequences: isMin, // join consecutive statements with the “comma operator”
      properties: isMin, // optimize property access: a["foo"] → a.foo
      drop_debugger: isMin, // discard “debugger” statements
      unsafe: false, // some unsafe optimizations (see below)
      conditionals: false, // optimize if-s and conditional expressions
      comparisons: isMin, // optimize comparisons
      evaluate: true,  // evaluate constant expressions
      booleans: isMin, // optimize boolean expressions
      loops: isMin, // optimize loops
      unused: true,  // drop unused variables/functions
      hoist_funs: isMin, // hoist function declarations
      hoist_vars: false, // hoist variable declarations
      if_return: isMin, // optimize if-s followed by return/continue
      join_vars: isMin, // join var declarations
      cascade: isMin, // try to cascade `right` into `left` in sequences
      side_effects: true,  // drop side-effect-free statements
      screw_ie8: true,
      global_defs: extend(config.globalDefs, { SC_RESOURCE_FOLDER_NAME: global.build.path })
    },
    output: {
      beautify: !isMin,
      comments: !isMin,
      bracketize: !isMin,
      indent_level: 2
    },
    mangle: isMin
  };
}


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
  return new Promise(
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
      var amdConfig = amdConfigs.getAmdConfig(sourceFolder, getUglifyOptions());
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
  return gulp.src(global.build.path + '/**/*.js')
    .pipe(size({ pretty: true, gzip: true, showFiles: true }));
}

module.exports = {
  showSizes: showSizes,
  prepareValidation: prepareValidation,
  validate: validate,
  compileFunctionMap: compileFunctionMap
};
