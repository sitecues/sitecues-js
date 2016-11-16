'use strict';

var exec = require('child_process').exec,
  config = require('../build-config');

function finalize(callback) {
  var fileName = 'sitecues-everywhere-' + config.version + '.zip',
    zipCommand = 'zip -r ' + fileName + ' * -x *.zip';
  exec(zipCommand, { cwd: config.baseBuildDir }, callback);
}

module.exports = finalize;
