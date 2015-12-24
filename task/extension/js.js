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
  size = config.isShowingSizes && require('gulp-size'),
  Promise_ = require('bluebird'),   // TODO update bamboo to use node 3+ and remove this polyfill dependency
  sourceFolders = require('../module-config').sourceFolders,
  uglify = require('gulp-uglify'),
  compileFunctionMap = getCompileFunctionMap(),
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  AMD_CONFIG = {
    include: getAllModuleJs(),
    exclude: [ 'page/zepto/zepto' ],  // Use jquery instead of zepto as it works in more cases (compatibility with pages that use Prototype.js)
    wrap: {
      start: config.runtimeConfig + "'use strict';"
    },
    optimize: config.isMinifying ? 'uglify2' : 'none',
    baseUrl: JS_SOURCE_DIR,
    out: config.buildDir + '/js/sitecues.js',
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourceMaps,
    removeCombined: true,
    useStrict: true,
    paths: {
      'core/conf/user/storage-backup': '../../extension/source/js/overrides/storage-backup'
    },
    map: {
      '*': {
        '$': 'jquery'
      }
    },
    //logLevel: 4,
    uglify2: {
      compress: {
        dead_code: true
      },
      mangle: true
    },
    insertRequire: [ 'core/core' ]
  };

function getCompileFunctionMap() {
  var functionMap = {};

  functionMap[config.librarySourceDir] = optimizeLibrary;
  functionMap[config.extensionSourceDir] = copyExtensionScripts;
  functionMap['node_modules/almond/almond.js'] = copyAlmond;

  return functionMap;
}

function getAllModuleJs() {
  return sourceFolders.map(function(moduleName) {
    if (moduleName === 'locale-data') {
      return moduleName + '/en'; // TODO include all languages (for now assumes English)
    }
    else {
      return moduleName + '/' + moduleName;
    }
  });
}

function optimizeLibrary() {
  return new Promise_(
    function(resolve, reject) {
      requirejs.optimize(
        AMD_CONFIG,
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
