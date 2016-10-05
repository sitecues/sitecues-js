'use strict';

var exec = require('child_process').exec,
  config = require('../build-config'),
  gulp = require('gulp');

// Currently no metadata for extension
function prepare() {
  return gulp.src(config.metaDataGlob)
    .pipe(gulp.dest(config.resourceDir));
}

function finalize(callback) {
  var fileName = 'sitecues-everywhere-' + config.version + '.zip',
    zipCommand = 'zip -r ' + fileName + ' * -x *.zip';
  exec(zipCommand, { cwd: config.baseBuildDir }, callback);
}

module.exports = {
  prepare: prepare,
  finalize: finalize
};