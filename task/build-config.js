// Environment variables:
// HTTPS = 'on' (forces port = 80)
// PROD = 'on' (not sure what this means)
// PORT
// CLEAN_DEPS = 'on' (refresh node_modules dependencies)
// LINT = 'on' or 'off' (force linting on or off, otherwise use resources for the target)
// MINIFY = 'on' or 'off' (force minification on or off, otherwise use default for the target)

'use strict';

var dateFormat = require('dateformat'),
  buildType = process.env.TYPE || 'common',
  baseBuildDir = 'target',
  extendBuildConfig = require('./' + buildType + '/extend-build-config'),
  userName = (process.env.VAGRANT_USER || process.env.SUDO_USER || process.env.USER || process.env.LOGNAME || 'UNKNOWN').toUpperCase(),
  today = new Date(),
  defaultVersion = dateFormat(today, 'yyyymmddHHMMss', true) + '-LOCAL-' + userName,
  version = process.env.VERSION || defaultVersion,
  isDebugOn = process.env.DEBUG !== 'off', // Default is true
  NODE_VERSION = parseFloat(process.versions.node),
  LIBRARY_SOURCE = 'source';

var baseConfig = {
  version: version,
  buildType: buildType,
  baseBuildDir: baseBuildDir,
  buildDir: baseBuildDir + '/' + buildType,
  resourceFolderName: '.',
  postBuildCommand: process.env.POST_BUILD_COMMAND,  // Optional post build shell command to run
  isLintingOn: process.env.LINT !== 'off', // Default to true
  // Three types of cleaning
  // CLEAN=off -- no cleaning
  // CLEAN=all -- clean everything
  // CLEAN=build_target (default) -- clean specific target only (e.g. target/extension or target/common)
  isCleaningTarget: process.env.CLEAN !== 'off', // Default to true
  isCleaningAll: process.env.CLEAN === 'all', // Default to false
  isMinifying: process.env.MINIFY === 'on', // Default to false
  isDebugOn: isDebugOn,  // Default to false
  nodeVersion: NODE_VERSION,
  isShowingSizes: NODE_VERSION >= 4 && process.env.SHOW_SIZES !== 'off', // Don't show sizes for old versions of node that don't support gulp-size
  isGeneratingSourceMaps: process.env.SOURCEMAPS ? (process.env.SOURCEMAPS === 'on') : isDebugOn, // Default to same as debug state
  isShowingGzipSize: process.env.SHOW_GZIP_SIZE === 'on',
  librarySourceDir: LIBRARY_SOURCE
};

// Add additional convenience properties
function finalizeConfig(config) {
  config.resourceDir = config.buildDir + '/' + config.resourceFolderName;
  config.globalDefs = {
    SC_EXTENSION: config.isExtension,
    SC_RESOURCE_FOLDER_NAME: config.resourceFolderName,
    SC_LOCAL: config.isLocal,
    SC_DEV: config.isDebugOn
  };

  return config;
}

var finalConfig = finalizeConfig(extendBuildConfig(baseConfig));

module.exports = finalConfig;

