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
  extend = require('extend'),
  config = require('../build-config'),
  size = config.isShowingSizes && require('gulp-size'),
  path = require('path'),
  pkgDir = require('pkg-dir'),
  Promise_ = require('bluebird'),   // TODO update bamboo to use node 3+ and remove this polyfill dependency
  moduleConfig = require('../module-config'),
  sourceFolders = moduleConfig.sourceFolders,
  amdModuleConfigs = moduleConfig.amdConfigs,
  absoluteSourceFolder,
  absoluteSourceFolderStringLength,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  compileFunctionMap = getCompileFunctionMap(),
  AMD_BASE_CONFIG = {
    wrap: {
      start: "'use strict';"
    },
    baseUrl: JS_SOURCE_DIR,
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourceMaps,
    removeCombined: true,
    namespace: 'sitecues',
    useStrict: true,
    paths: {
      '$': 'empty:'
    },
    uglify2: {
      compress: {
        dead_code: true
      },
      mangle: true
    },
    onModuleBundleComplete: onModuleBundleComplete
  };

function getAmdConfig(bundleName) {
  var amdConfig = extend({}, AMD_BASE_CONFIG, amdModuleConfigs[bundleName]);
  if (!amdConfig.doDisableBundling) {
    amdConfig.include = (amdConfig.include || []);
    amdConfig.include.push(bundleName + '/' + bundleName);
  }

  return amdConfig;
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

  sourceFolders.forEach(function(sourceFolder) {
    var includedInBundle = bundleIncludesSourcesMap[sourceFolder],
      bundlePath = sourceFolder + '/',
      bundlePathLength = bundlePath.length;

    if (amdModuleConfigs[sourceFolder].doDisableBundling) {
      return;
    }

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

function optimize(name, amdConfig) {
  amdConfig.optimize = config.isMinifying ? 'uglify2' : 'none';
  if (!amdConfig.doDisableBundling) {  // Output file name if not outputting a dir as we do for locale-data
    amdConfig.name = name;
    amdConfig.out = amdConfig.out || (config.resourceDir + '/js/' + name + '.js');
    amdConfig.create = true;
  }

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
  sourceFolders.forEach(function (sourceFolder) {
    var fn = function () {
      var amdConfig = getAmdConfig(sourceFolder);
      return optimize(sourceFolder, amdConfig);
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
