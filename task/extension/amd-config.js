'use strict';

var config = require('../build-config.js'),
  sourceFoldersConfig = require('../source-folders.json'),
  bundleFolders = sourceFoldersConfig.bundleFolders,
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  glob = require('glob'),
  dataFolders = sourceFoldersConfig.dataFolders,
  dataModules = getDataModules(),
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
      'run/ab-test/ab-test': '../../extension/source/js/overrides/ab-test',
      'mini-core/user': '../../extension/source/js/overrides/user',
      'mini-core/native-global': '../../extension/source/js/overrides/native-globals',
      'run/data-map': config.tmpDir + '/data-map',
// sitecues.define('mini-core/native-global', [], function () { return sitecues._shared.nativeGlobal; });
// sitecues.define('mini-core/page-view', [], function () { return sitecues._shared.pageView; });
// sitecues.define('mini-core/session', [], function () { return sitecues._shared.session; });
// sitecues.define('mini-core/site', [], function () { return sitecues._shared.site; });
// sitecues.define('mini-core/user', [], function () { return sitecues._shared.user; });
      // UNUSED in the extension
      'run/errors': 'empty:',
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
