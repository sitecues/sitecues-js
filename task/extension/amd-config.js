'use strict';

var config = require('../build-config.js'),
  sourceFoldersConfig = require('../source-folders.json'),
  bundleFolders = sourceFoldersConfig.bundleFolders,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  amdConfig = {
    include: getSourceFolders(),
    exclude: [ 'page/zepto/zepto' ],  // Use jquery instead of zepto as it works in more cases (compatibility with pages that use Prototype.js)
    wrap: {
      start: 'sitecues.version="' + config.version + '";\n' +
        '"use strict";\n'
    },
    optimize: 'none',
    baseUrl: JS_SOURCE_DIR,
    out: config.tmpFile,
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourceMaps,
    skipModuleInsertion: true, // Recommended by amdclean documentation when not using shims
    removeCombined: true,
    useStrict: true,
    paths: {
      'core/conf/user/storage-backup': '../../extension/source/js/overrides/storage-backup'
    },
    map: {
      '*': {
        '$': 'empty:'  // Extension always uses jQuery in order to be compatible with pages that use Prototype.js
      }
    },
    insertRequire: [ 'core/core' ]
  };

function getSourceFolders() {
  var mainModules = bundleFolders.map(function(folderName) {
    return folderName + '/' + folderName;
  });
  return ['locale-data/en'].concat(mainModules); // TODO figure out how to include all languages
}

module.exports = amdConfig;
