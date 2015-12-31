// sitecues JS modules

'use strict';

var config = require('../build-config'),
  sourceConfig = require('../source-folders.json'),
  bundleFolders = sourceConfig.bundleFolders,
  dataFolders = sourceConfig.dataFolders,
  sourceFolders = bundleFolders.concat(dataFolders),
  extend = require('extend'),
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  AMD_BASE_CONFIG = {
    wrap: {
      start: '"use strict";\n'
    },
    baseUrl: JS_SOURCE_DIR,
    preserveLicenseComments: false,
    generateSourceMaps: config.isGeneratingSourceMaps,
    removeCombined: false,
    optimize: 'uglify2',
    namespace: 'sitecues',
    useStrict: true,
  },
  AMD_SPECIAL_CONFIGS = {
    // Core module special treatment
    core: {
      // Rename core.js to sitecues.js
      out: config.buildDir + '/js/sitecues.js',
      // sitecues.js gets version number
      wrap: {
        start: 'sitecues.version="' + config.version + '";\n' +
          '"use strict";\n'
      },
      // Include alameda in core
      include: [ 'core/alameda-custom' ],
      // Make sure core initializes itself
      insertRequire: [ 'core/core' ]
    },
    page: {
      // In-page library for sitecues bundles zepto.
      // This is not done for the extension, which prefers jquery for compatibility with Prototype.js
      include: [ 'page/zepto/zepto' ]
    }
  };

function isDataFolder(sourceFolderName) {
  return dataFolders.indexOf(sourceFolderName) >= 0;
}

// Each bundle must include the BUNDLE_NAME/BUNDLE_NAME main module, e.g. theme/theme
function includeMainModule(amdConfig, bundleName) {
  amdConfig.include = amdConfig.include || [];
  amdConfig.include.push(bundleName + '/' + bundleName);
}

// Configuration for a data folder
function getDataFolderConfig(amdConfig, sourceFolder) {
  // Where to find locale-data
  amdConfig.baseUrl = JS_SOURCE_DIR + '/' + sourceFolder;
  // Where to put locale-data
  amdConfig.dir = config.resourceDir + '/js/' + sourceFolder;

  return amdConfig;
}

// Configuration for a source bundle
function getBundleConfig(amdConfig, bundleName) {
  amdConfig.name = bundleName;
  amdConfig.create = true;
  amdConfig.out = amdConfig.out || (config.resourceDir + '/js/' + bundleName + '.js');
  amdConfig.baseUrl = JS_SOURCE_DIR + '/';
  amdConfig.fileExclusionRegExp = new RegExp('^' + bundleName + '$');
  includeMainModule(amdConfig, bundleName);

  var paths = { '$': 'empty:' }; // Determine location of $ at runtime (jquery vs zepto)

  bundleFolders.forEach(function(otherBundle) {
    if (otherBundle !== bundleName) {
      paths[otherBundle] = 'empty:';  // Other bundle is not found
    }
  });
  amdConfig.paths = paths;


  return amdConfig;
}

// Configuration for a source folder, whether a bundle or data
function getAmdConfig(sourceFolderName, uglifyOptions) {

  var amdConfig = extend(true, { uglify2: uglifyOptions }, AMD_BASE_CONFIG, AMD_SPECIAL_CONFIGS[sourceFolderName]);

  if (isDataFolder(sourceFolderName)) {
    return getDataFolderConfig(amdConfig, sourceFolderName);
  }
  else {
    return getBundleConfig(amdConfig, sourceFolderName);
  }
}

module.exports = {
  getAmdConfig: getAmdConfig,
  bundleFolders: bundleFolders,
  dataFolders: dataFolders,
  sourceFolders: sourceFolders  // both bundle and data folders
};