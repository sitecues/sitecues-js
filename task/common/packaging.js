'use strict';

var config = require('../build-config'),
  gulp = require('gulp'),
  fs = require('fs'),
  exec = require('child_process').exec,
  mkdirp = require('mkdirp');

function createPackage(callback) {
  var fileName = config.baseBuildDir + '/sitecues-js-' + config.version + '.tgz',
    gzipCommand = 'tar -C ' + config.buildDir + ' -zcf ' + fileName + ' .';
  exec(gzipCommand, callback);
}

// Create a copy of sitecues.js in the buildDir with a name in the format sitecues-[VERSION_NAME].js
function createVersionedSitecuesJsCopy(callback) {
  exec('cp ' + config.buildDir + '/js/core.js ' + config.buildDir + '/core-' + config.version + '.js', callback);
}

function saveVersionTxt(callback) {
  mkdirp(config.buildDir, {}, function() {
    fs.writeFile(config.buildDir + '/VERSION.TXT', config.version, callback);
  });
}

// TODO this is possibly no longer necessary, and any references to it in CI should probably be removed. We don't use custom builds anymore
function saveBuildTxt(callback) {
  mkdirp(config.buildDir, {}, function() {
    fs.writeFile(config.buildDir + '/BUILD.TXT', 'SC_BUILD_NAME=' + config.buildType, callback);
  });
}

function createMetaData(callback) {
  createVersionedSitecuesJsCopy(function() {
    saveVersionTxt(function() {
      saveBuildTxt(callback);
    });
  });
}

function copySiteIdVersionMap() {
  return gulp.src('./versions-by-site.yml')
    .pipe(gulp.dest(config.buildDir));
}

module.exports = {
  createMetaData: createMetaData,
  copySiteIdVersionMap: copySiteIdVersionMap,
  createPackage: createPackage
};

