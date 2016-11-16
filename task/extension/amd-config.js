'use strict';

var config = require('../build-config.js'),
  sourceFoldersConfig = require('../source-folders.json'),
  bundleFolders = sourceFoldersConfig.bundleFolders,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  glob = require('glob'),
  dataFolders = sourceFoldersConfig.dataFolders,
  dataModules = getDataModules(),
  OVERRIDES_DIR = '../../extension/source/js/overrides/',
  amdConfig = {
    include: getIncludes(dataModules),
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
      'core/user': OVERRIDES_DIR + 'user',
      'core/native-global': OVERRIDES_DIR + 'native-global',
      'core/page-view': OVERRIDES_DIR + 'page-view',
      'core/session': OVERRIDES_DIR + 'session',
      'run/data-map': config.tmpDir + '/data-map',
      // UNUSED in the extension (stubbed methods)
      'run/ab-test/ab-test': OVERRIDES_DIR + 'ab-test',
      'run/metric/metric': OVERRIDES_DIR + 'metric',
      'run/errors': OVERRIDES_DIR + 'errors',
      // UNUSED and EMPTY in the extension
      'run/bp/badge/page-badge': 'empty:',
      'run/bp/badge/palette': 'empty:',
      'bp-img-placeholder/bp-img-placeholder/': 'empty:',
      'bp-adaptive/bp-adaptive': 'empty:',
      'network-player/network-player': 'empty:'
    },
    map: {
      '*': {
        '$': 'empty:'  // Extension always uses jQuery in order to be compatible with pages that use Prototype.js
      }
    },
    insertRequire: [ 'core/run' ]
  };

// Get a list of data modules, which are any .js files in data folders listed in source-folders.json
function getDataModules() {
  var allDataModules = [];
  dataFolders.forEach(function(dataFolder) {

    var dir = config.librarySourceDir + '/js/' + dataFolder,
      filesList = glob.sync(dir + '/**/*.js'),
      dataModules;
    if (!filesList) {
      throw('No data files found for: ' + dir);
    }

    dataModules = filesList.map(function(fileName) {
      var relativeFileName = fileName.split(JS_SOURCE_DIR + '/')[1];  // Strip off source/js/
      return relativeFileName.split('.js')[0]; // E.g. en.js -> locale-data/en
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
