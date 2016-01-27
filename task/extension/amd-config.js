'use strict';

var config = require('../build-config.js'),
  fs = require('fs'),
  sourceFoldersConfig = require('../source-folders.json'),
  bundleFolders = sourceFoldersConfig.bundleFolders,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  dataFolders = sourceFoldersConfig.dataFolders,
  dataModules = getDataModules(),
  amdConfig = {
    include: getIncludes(dataModules),
    exclude: [ 'page/zepto/zepto' ],  // Use jquery instead of zepto as it works in more cases (compatibility with pages that use Prototype.js)
    wrap: {
      start: 'sitecues.version="' + config.version + '";\n' +
        '"use strict";\n'
    },
    optimize: 'none',
    baseUrl: JS_SOURCE_DIR,
    out: config.tmpDir + '/sitecues.js',
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourceMaps,
    skipModuleInsertion: true, // Recommended by amdclean documentation when not using shims
    removeCombined: true,
    useStrict: true,
    paths: {
      // In runtime config, via definePrim : 'Promise' to allow use of alameda's built-in Prim library
      'Promise': 'empty:',
      // DIFFERENT in the extension
      'core/conf/user/storage-backup': '../../extension/source/js/overrides/storage-backup',
      'core/data-map': config.tmpDir + '/data-map',
      // UNUSED in the extension
      'core/bp/badge/page-badge': 'empty:',
      'core/bp/badge/palette': 'empty:',
      'bp-img-placeholder/bp-img-placeholder/': 'empty:',
      'bp-adaptive/bp-adaptive': 'empty:'
    },
    map: {
      '*': {
        '$': 'empty:'  // Extension always uses jQuery in order to be compatible with pages that use Prototype.js
      }
    },
    insertRequire: [ 'core/core' ]
  };

// Get a list of data modules, which are any .js files in data folders listed in source-folders.json
function getDataModules() {
  var allDataModules = [];
  dataFolders.forEach(function(dataFolder) {
    var dir = config.librarySourceDir + '/js/' + dataFolder,
      filesList = fs.readdirSync(dir),
      dataModules;
    if (!filesList) {
      throw('No data files found for: ' + dir);
    }

    dataModules = filesList.map(function(fileName) {
      return dataFolder + '/' + fileName.split('.js')[0]; // E.g. en.js -> locale-data/en
    });

    // Put data folders first
    allDataModules = dataModules.concat(allDataModules);
  });

  return allDataModules;
}

// Get all includes for the main bundle
function getIncludes(dataModules) {
  var modulesList = bundleFolders.map(function(folderName) {
    return folderName + '/' + folderName;
  });

  return dataModules.concat(modulesList);
}

function getAmdConfig() {
  return amdConfig;
}

module.exports = {
  getAmdConfig: getAmdConfig,
  dataFolders: dataFolders,
  dataModules: dataModules
};
