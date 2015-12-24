'use strict';

var gulp = require('gulp'),
  config = require('./build-config'),
  jshint = require('gulp-jshint');

function lint() {
  var lintFileName = 'source/js/.jshintrc' + (config.isDebugOn ? '-debug' : '');
  return gulp.src([config.jsGlob, '!source/js/**/jquery.js', '!source/js/**/zepto.js' ])
  .pipe(jshint(lintFileName))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
}

module.exports = lint;

