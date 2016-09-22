'use strict';

var gulp = require('gulp'),
  lint = require('./task/lint'), // Include compileJs task
  config = require('./task/build-config'),
  targetTaskFolder = './task/' + config.buildType,
  js = require(targetTaskFolder + '/js'),
  packaging = require(targetTaskFolder + '/packaging'),
  templates = require('./task/templates'),
  resources = require('./task/resources'),
  removeAllDeadCode = require('./task/dead-code-removal'),
  exec = require('child_process').exec,
  del = require('del'); // If we want to do clean

function cleanAll() {
  return del(config.baseBuildDir);
}

function cleanTarget() {
  return del(config.baseBuildDir + '/' + config.buildType);
}

function noop(callback) {
  callback();
}

var clean = config.isCleaningAll ? cleanAll : (config.isCleaningTarget ? cleanTarget : noop);

// Report build configuration information, including versions
function reportConfig(callback) {
  console.log('Build configuration:');
  console.log(config);
  exec('echo npm version: `npm --version`', callback);
}

// JS tasks
gulp.task('js-lint', lint);

function getAllSourceFolderCompilationFns() {
  var jsCompileFunctions = Object.keys(js.compileFunctionMap);
  return jsCompileFunctions.map(function(compileFunctionName) {
    return js.compileFunctionMap[compileFunctionName];
  });
}
var jsCompileAndLint = getAllSourceFolderCompilationFns().concat(config.isLintingOn ? 'js-lint' : []); // Compile all source folders
gulp.task('js-compile-lint', gulp.parallel.apply(gulp, jsCompileAndLint));
gulp.task('js-validate', gulp.series(js.prepareValidation, js.validate));
gulp.task('js-show-sizes', js.showSizes);
var jsDoAll = [ 'js-compile-lint' ]
  .concat(config.isMinifying ? removeAllDeadCode : [])
  .concat('js-validate')
  .concat(config.isShowingSizes ? 'js-show-sizes': []);
gulp.task('js', gulp.series.apply(gulp, jsDoAll));

// Run an optional post build shell command specified via environment variable POST_BUILD_COMMAND
// TODO Use websockets once SC-3377 is fixed. See code in the post-build-command branch.
function runPostBuildCommand(callback) {
  exec(config.postBuildCommand, callback);
}

// General build and package tasks
var build =
  gulp.parallel(
    templates,             // Localized html
    resources.html,        // Non-localized html
    resources.css,
    resources.svg,
    resources.raster,
    resources.earcons,
    'js'
  );
gulp.task(cleanAll);
gulp.task(cleanTarget);
gulp.task('build', build);
gulp.task(reportConfig);
var defaultSeries = [reportConfig, clean, 'build', packaging.createMetaData, packaging.copySiteIdVersionMap ]
  .concat(config.postBuildCommand ? runPostBuildCommand : []);
gulp.task('default', gulp.series.apply(gulp, defaultSeries));
gulp.task('package', gulp.series('default', packaging.createPackage));

// Watcher tasks
gulp.task(function watch() {
  // JS
  var sourceFolders = Object.keys(js.compileFunctionMap);
  sourceFolders.forEach(function(sourceFolder) {
    gulp.watch(sourceFolder + '/**/*.js', js.compileFunctionMap[sourceFolder]);
  });

  // Non-JS
  gulp.watch(config.cssGlob, resources.css);
  gulp.watch(config.templateGlob, templates);
  gulp.watch(config.htmlGlob, resources.html);
  gulp.watch(config.earconsGlob, resources.earcons);
  gulp.watch(config.svgGlob, resources.svg);
  gulp.watch(config.rasterGlob, resources.raster);
  if (config.metaDataGlob) {
    gulp.watch(config.metaDataGlob, packaging.createMetaData);
  }

  if (config.postBuildCommand) {
    gulp.watch(config.buildDir + '/**/*', { name: 'postBuildCommand' }, runPostBuildCommand);
  }
});

