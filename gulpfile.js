"use strict";

var gulp = require('gulp'),
  compileHtmlTemplates = require('./task/compile-html'),
  compileJs = require('./task/compile-js'), // Include compileJs task
  config = require('./task/build-config'),
  resources = require('./task/compile-resources'),
  packageLibrary = require('./task/package-library'),
  exec = require('child_process').exec,
  del = require('del'); // If we want to do clean

function clean() {
  if (config.isCleaningOn) {
    return del(config.buildBaseDir);
  }
  else {
    return Promise.resolve();
  }
}

function report(callback) {
  // Report versions
  console.log('sitecues version: ' + config.version);
  console.log('node version: ' + process.version);
  exec('echo npm version: `npm --version`', callback);
}

// JS tasks
gulp.task('js-lint', compileJs.lint);
function getAllSourceFolderCompilationFns() {
  var sourceFolders = compileJs.sourceFolders;
  return sourceFolders.map(function(sourceFolderName) {
    return compileJs.compileSourceFolderMap[sourceFolderName];
  });
}
var jsCompileAndLint = getAllSourceFolderCompilationFns().concat(config.isLintingOn ? compileJs.lint : []); // Compile all source folders
gulp.task('js-compile-lint', gulp.parallel.apply(gulp, jsCompileAndLint));
gulp.task('js-validate', gulp.series(compileJs.prepareValidation, compileJs.validate));
gulp.task('js-show-sizes', compileJs.showSizes);
var jsDoAll = [ 'js-compile-lint', 'js-validate' ].concat(config.isShowingSizes ? 'js-show-sizes': []);
gulp.task('js', gulp.series.apply(gulp, jsDoAll));

// General build and package tasks
var build =
  gulp.parallel(
    compileHtmlTemplates,  // Localized html
    resources.html,        // Non-localized html
    resources.css,
    resources.svg,
    resources.raster,
    resources.earcons,
    'js'
  );
gulp.task(clean);
gulp.task('build', build);
gulp.task(report);
gulp.task('default', gulp.series(clean, 'build', report));
gulp.task('package', gulp.series('default', packageLibrary));

// Watcher tasks
gulp.task(function watch() {
  compileJs.sourceFolders.forEach(function (bundleName) {
    gulp.watch('source/js/' + bundleName + '/**/*', compileJs.compileSourceFolderMap[bundleName]);
  });
  gulp.watch(config.CSS_GLOB, resources.css);
  gulp.watch(config.HTML_COMPILATION_GLOB, compileHtmlTemplates);
  gulp.watch(config.HTML_PLAIN_GLOB, resources.html);
  gulp.watch(config.EARCONS_GLOB, resources.earcons);
  gulp.watch(config.SVG_GLOB, resources.svg);
  gulp.watch(config.RASTER_GLOB, resources.raster);
});
