'use strict';

var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  yamlValidate = require('gulp-yaml-validate'),
  check = require('gulp-check'),
  amdCheck = require('gulp-amdcheck'),
  ES5_LINT_GLOB = [ 'source/js/**/*.js', '!source/js/**/jquery.js', '!source/js/core/prereq/alameda-custom.js' ],
  ES6_LINT_GLOB = [
    'extension/source/js/**/*.js', '!extension/source/js/templated-code/**/*',
    // TODO lint tests
    //'test/**/*.js', '!test/legacy/**/*.js'.
    'gulpfile.js', 'task/**/*.js'
  ],
  YAML_LINT_GLOB = [ './*.yml' ];


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

function lintYaml() {
  return gulp.src(YAML_LINT_GLOB)
    .pipe(yamlValidate());
}

var lintTasks =
  gulp.parallel(
    lintES5,
    lintES6,
    checkAmd,
    checkForNativeFns,
    lintYaml
  );

module.exports = lintTasks;

