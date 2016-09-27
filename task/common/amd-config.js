// sitecues JS modules

'use strict';

var config = require('../build-config'),
  sourceConfig = require('../source-folders.json'),
  bundleFolders = sourceConfig.bundleFolders,
  dataFolders = sourceConfig.dataFolders,
  sourceFolders = bundleFolders.concat(dataFolders),
  extend = require('extend'),
  fs = require('fs'),
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  PATHS = {
    'nativeFn' : 'empty:',
    'iframeFactory': 'empty:',
    '$': 'empty:',
    'Promise': 'empty:',   // In runtime config, via definePrim : 'Promise' to allow use of alameda's built-in Prim library
    'core/conf/user/storage': 'empty:',  // Defined by minicore shared code
    'core/conf/user/storage-backup': 'empty:'  // Defined by minicore shared code
  },
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
    useStrict: true
  },
  AMD_SPECIAL_CONFIGS = {
    // Core module special treatment
    core: {
      // Rename core.js to sitecues.js
      out: config.resourceDir + '/js/core.js',
      // sitecues.js gets version number
      wrap: {
        start: buildCorePreamble()
      },
      // Include alameda in core
      include: [
        'core/alameda-custom',
        'core/errors',
        'core/prereq/iframe-factory',
        'core/prereq/native-functions'
      ],
      // Make sure core initializes itself
      insertRequire: [ 'core/errors', 'core/core' ]
    },
    page: {
      include: [ 'page/jquery/jquery' ]
    }
  };

function buildCorePreamble() {
  const prefix = 'if (sitecues && sitecues.exists) throw new Error("The sitecues library already exists on this page.");\n' +
    'Object.defineProperty(sitecues, "version", { value: "' + config.version + '", writable: false });\n' +
    '"use strict";';

  function getPrereqPath(fileName) {
    return JS_SOURCE_DIR + '/core/prereq/' + fileName;
  }

  function getPrereqContent(fileName) {
    return fs.readFileSync(getPrereqPath(fileName));
  }

  return [
    prefix,
    getPrereqContent('shared-modules.js'),
    getPrereqContent('custom-event-polyfill.js'),
    getPrereqContent('global-assignments.js'),
    getPrereqContent('alameda-config.js')
  ].join('\n');
}

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

  var paths = extend({}, PATHS);

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
