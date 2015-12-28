'use strict';

var config = require('../build-config.js'),
  sourceFoldersConfig = require('../source-folders.json'),
  bundleFolders = sourceFoldersConfig.bundleFolders,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  amdConfig = {
    include: getSourceFolders(),
    exclude: [ 'page/zepto/zepto' ],  // Use jquery instead of zepto as it works in more cases (compatibility with pages that use Prototype.js)
    wrap: {
      start: config.runtimeConfig + "'use strict';"
    },
    optimize: config.isMinifying ? 'uglify2' : 'none',
    baseUrl: JS_SOURCE_DIR,
    out: config.buildDir + '/js/sitecues.js',
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourceMaps,
    removeCombined: true,
    useStrict: true,
    paths: {
      'core/conf/user/storage-backup': '../../extension/source/js/overrides/storage-backup'
    },
    map: {
      '*': {
        '$': 'jquery'  // Extension always uses jQuery in order to be compatible with pages that use Prototype.js
      }
    },
    //logLevel: 4,
    uglify2: {
      compress: {
        dead_code: true
      },
      mangle: true
    },
    insertRequire: [ 'core/core' ]
  };

function getSourceFolders() {
  var mainModules = bundleFolders.map(function(folderName) {
    return folderName + '/' + folderName;
  });
  return mainModules.concat('locale-data/en'); // TODO figure out how to include all languages
}

module.exports = amdConfig;
