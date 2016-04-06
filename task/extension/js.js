/**
 * 1. Create bundle.js files for bundles, e.g. bp-expanded.js -- each bundle can contain multiple sources
 * 2. Move over other orphaned .js files that are not included in a bundle but are used individually
 * All .js gets the rjs namespacing treatment (sitecues.define, etc.) and is minified if the config. isMinifying option is set.
 * Definitions:
 * - Source: a small individual .js source file
 * - Bundle: a compiled bundle .js file
 */

'use strict';

var gulp = require('gulp'),
  requirejs = require('requirejs'),
  config = require('../build-config'),
  intermediateSitecuesJs = config.tmpDir + '/sitecues.js',
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  amdConfig = require('./amd-config'),
  handlebars = require('gulp-compile-handlebars'),
  rename = require('gulp-rename'),
  fs = require('fs'),
  amdClean = require('amdclean'),
  size = config.isShowingSizes && require('gulp-size'),
  replace = require('gulp-replace'),
  PAGE_DISABLED_CHECK = 'if (window.localStorage.getItem("sitecues-disabled") !== "true") (function() {',
  isMin = config.isMinifying,
  uglify = require('gulp-uglify'),
  uglifyOptions = {
    // Compressor options always remove dead code, but provide readable code in non-minified versions
    compress: {
      dead_code     : true,  // Remove dead code whether minifying or not
      sequences     : isMin, // join consecutive statements with the “comma operator”
      properties    : isMin, // optimize property access: a["foo"] → a.foo
      drop_debugger : isMin, // discard “debugger” statements
      unsafe        : false, // some unsafe optimizations (see below)
      conditionals  : false, // optimize if-s and conditional expressions
      comparisons   : isMin, // optimize comparisons
      evaluate      : true,  // evaluate constant expressions
      booleans      : isMin, // optimize boolean expressions
      loops         : isMin, // optimize loops
      unused        : true,  // drop unused variables/functions
      hoist_funs    : isMin, // hoist function declarations
      hoist_vars    : false, // hoist variable declarations
      if_return     : isMin, // optimize if-s followed by return/continue
      join_vars     : isMin, // join var declarations
      cascade       : isMin, // try to cascade `right` into `left` in sequences
      side_effects  : true,  // drop side-effect-free statements
      screw_ie8: true,
      global_defs: config.globalDefs
    },
    output: {
      beautify: !isMin,
      comments: !isMin,
      bracketize: !isMin,
      indent_level: 2
    },
    mangle: isMin
  },
  compileFunctionMap = getCompileFunctionMap();

function getCompileFunctionMap() {
  var functionMap = {};

  functionMap[JS_SOURCE_DIR] = compileLibrary;
  functionMap[config.extensionSourceDir + '/js/'] = copyExtensionScripts;
  functionMap[JS_SOURCE_DIR + 'page/jquery/jquery.js'] = copyJQuery;

  return functionMap;
}

function generateTemplatedCode() {
  return new Promise(function(resolve, reject) {
    var handlebarsOptions = {};
    gulp.src(config.extensionSourceDir + '/js/templated-code/data-map.hbs.js')
      .pipe(handlebars({dataModules: amdConfig.dataModules}, handlebarsOptions))
      .pipe(rename( 'data-map.js' ))
      .pipe(gulp.dest(config.tmpDir))
      .on('finish', resolve)
      .on('error', reject);
  });
}

function optimizeLibrary() {
  return new Promise(function(resolve, reject) {
    requirejs.optimize(
      amdConfig.getAmdConfig(),
      // We will uglify below after replacing platform.browser.foo variables we know about, this allowing more dead code removal.
      // If we decide to let r.js do it, we can uncomment the following line:
      // extend(true, {}, amdConfig, { optimize: 'uglify2', uglify2 : uglifyOptions }),
      resolve,
      reject
    );
  });
}

function cleanLibrary() {
  return new Promise(
    function(resolve, reject) {
      var cleanedCode = amdClean.clean({
        filePath: intermediateSitecuesJs
      });
      fs.writeFile(intermediateSitecuesJs, cleanedCode, function(err) {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    }
  );
}

function compressLibrary() {
  return gulp.src(intermediateSitecuesJs)
    // Check before IIFE so that no init code runs if page disabled -- only does this replacement once
    .pipe(replace(/^\;\(function\(\) \{/, PAGE_DISABLED_CHECK))
    // These replacements allow uglify to remove a lot of dead code -- these replacements are global
    .pipe(replace('platform.browser.isIE9', 'false'))
    .pipe(replace('platform.browser.isIE', 'false'))
    .pipe(replace('platform.browser.isFirefox', 'false'))
    .pipe(replace('platform.browser.isSafari', 'false'))
    .pipe(replace('platform.browser.isChrome', 'true'))
    .pipe(replace('platform.browser.isWebKit', 'true'))
    .pipe(uglify(uglifyOptions))
    .pipe(gulp.dest(config.buildDir + '/js'));
}

function compileLibrary() {
  return generateTemplatedCode()
    .then(optimizeLibrary)
    .then(cleanLibrary)
    .then(compressLibrary);
}

function showSizes() {
  return gulp.src(config.buildDir + '/**/*.js')
    .pipe(size({ pretty: true, gzip: true, showFiles: true }));
}

function noop(callback) {
  return callback();
}

function copyScripts(glob) {
  return gulp.src(glob)
    .pipe(uglify(uglifyOptions))
    .pipe(gulp.dest(config.resourceDir + '/js'));
}

function copyExtensionScripts() {
  // Copy everything except templates which need different processing and override modules,
  // both of which are included in the generated sitecues.js via AMD path configuration
  return copyScripts([config.extensionSourceDir + '/js/**/*.js',
    '!' + config.extensionSourceDir + '/js/overrides/**/*',
    '!' + config.extensionSourceDir + '/js/templated-code/**/*'
  ]);
}

function copyJQuery() {
  return copyScripts(config.librarySourceDir + '/js/page/jquery/jquery.js');
}

module.exports = {
  showSizes: showSizes,
  prepareValidation: noop,
  validate: noop, // TODO validate extension
  compileFunctionMap: compileFunctionMap
};
