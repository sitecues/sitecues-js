'use strict';

var gulp = require('gulp'),
  jshint = require('gulp-jshint');

function lint() {
  var LINT_GLOB = [
    'source/js/**/*.js', '!source/js/**/jquery.js', '!source/js/**/zepto.js',
    'extension/source/js/**/*.js', '!extension/source/js/templated-code/**/*',
    'gulpfile.js', 'task/**/*.js',
    'test/**/*.js', '!test/legacy/**/*.js'
  ];
  return gulp.src(LINT_GLOB)
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
}

module.exports = lint;

