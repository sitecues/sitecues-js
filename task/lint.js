'use strict';

var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  check = require('gulp-check');

function lint() {
  var LINT_GLOB = [
    'source/js/**/*.js', '!source/js/**/jquery.js', '!source/js/core/alameda-custom.js',
    'extension/source/js/**/*.js', '!extension/source/js/templated-code/**/*',
    // TODO lint tests
    //'test/**/*.js', '!test/legacy/**/*.js'.
    'gulpfile.js', 'task/**/*.js'
  ];

  return gulp.src(LINT_GLOB)
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
}

// Don't allow Function.prototype.bind() usage as it conflicts with Mootools
// It's okay if it is commented -- preceded by //
function checkForBindUsage() {
  var LINT_GLOB = [
    'source/js/**/*.js'
  ];

  return gulp.src(LINT_GLOB)
    .pipe(check(/\.bind *\(/))
    .on('error', function (err) {
      console.log('Don\'t use Function.prototype.bind() as it is incompatible with Mootools:\n' + err);
    });
}

checkForBindUsage.displayName = 'checkForBindUsage';

var lintTasks =
  gulp.parallel(
    lint,
    checkForBindUsage
  );

module.exports = lintTasks;

