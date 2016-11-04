// sitecues JS modules

'use strict';

var config = require('../build-config'),
  sourceConfig = require('../source-folders.json'),
  bundleFolders = sourceConfig.bundleFolders,
  dataFolders = sourceConfig.dataFolders,
  sourceFolders = bundleFolders.concat(dataFolders),
  path = require('path'),
  extend = require('extend'),
  fs = require('fs'),
  JS_SOURCE_DIR = config.librarySourceDir + '/js',
  PATHS = {
    'mini-core/native-global' : 'empty:',
    'mini-core/user' : 'empty:',
    'mini-core/page-view' : 'empty:',
    'mini-core/session' : 'empty:',
    '$': 'empty:',
    'Promise': 'empty:'   // In runtime config, via definePrim : 'Promise' to allow use of alameda's built-in Prim library
  };

function getAmdBaseConfig() {
  return {
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
  };
}

function getAmdSpecialConfigs() {
  return {
    // Core module special treatment
    run: {
      // sitecues.js gets version number
      wrap: {
        start: buildCorePreamble()
      },
      // Include alameda in core
      include: [
        'run/prereq/alameda-custom',
        'run/prereq/shared-modules',
        'run/errors'
      ],
      // Make sure core initializes itself
      insertRequire: ['run/errors', 'run/run']
    },
    page: {
      include: ['page/jquery/jquery']
    }
  };
}

function buildCorePreamble() {
  const prefix = 'Object.defineProperty(sitecues, "version", ' +
    '{ value: "' + global.buildBranch + '/' + global.buildVersion + '", writable: false });\n' +
    '"use strict";';

  function getPrereqPath(fileName) {
    return path.join(JS_SOURCE_DIR, 'run', 'prereq', fileName);
  }

  function getPrereqContent(fileName) {
    return fs.readFileSync(getPrereqPath(fileName));
  }

  return [
    prefix,
    getPrereqContent('custom-event-polyfill.js'),
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
  amdConfig.dir = path.join(global.buildDir, 'js', sourceFolder);

  return amdConfig;
}

// Configuration for a source bundle
function getBundleConfig(amdConfig, bundleName) {
  amdConfig.name = bundleName;
  amdConfig.create = true;
  amdConfig.out = amdConfig.out || path.join(global.buildDir, 'js', bundleName + '.js');
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

  var amdConfig = extend(true, { uglify2: uglifyOptions }, getAmdBaseConfig(), getAmdSpecialConfigs()[sourceFolderName]);

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
