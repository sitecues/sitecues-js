'use strict';

var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  check = require('gulp-check'),
  amdCheck = require('gulp-amdcheck'),
  ES5_LINT_GLOB = [ 'source/js/**/*.js', '!source/js/**/jquery.js', '!source/js/core/alameda-custom.js', '!source/js/core/native-functions' ],
  ES6_LINT_GLOB = [
    'extension/source/js/**/*.js', '!extension/source/js/templated-code/**/*',
    // TODO lint tests
    //'test/**/*.js', '!test/legacy/**/*.js'.
    'gulpfile.js', 'task/**/*.js'
  ];

function lintES5() {
  return gulp.src(ES5_LINT_GLOB)
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
}

function lintES6() {
  return gulp.src(ES6_LINT_GLOB)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
}

//Don't allow calls to setTimeout, Map, bind from the global scope, they may have been overridden
function checkForNativeFns() {
  return gulp.src(ES5_LINT_GLOB)
    .pipe(check(/[^\.\w]JSON *\(/))
    .pipe(check(/[^\.\w]setTimeout *\(/))
    .pipe(check(/[^\.\w]Map *\(/))
    .pipe(check(/[^\.\w]bind *\(/))
    .on('error', function (err) {
      console.log('Don\'t allow calls to setTimeout, Map, bind from the global scope, they may have been overridden:\n' + err);
    });
}

function checkAmd() {
  return gulp.src(ES5_LINT_GLOB)
    .pipe(amdCheck({
      errorOnUnusedDependencies: true,
      logUnusedDependencyPaths: false
    }));
}

var lintTasks =
  gulp.parallel(
    lintES5,
    lintES6,
    checkAmd,
    checkForNativeFns
  );

module.exports = lintTasks;

