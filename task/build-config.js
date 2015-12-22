// Environment variables:
// HTTPS = 'on' (forces port = 80)
// PROD = 'on' (not sure what this means)
// PORT
// CLEAN_DEPS = 'on' (refresh node_modules dependencies)
// LINT = 'on' or 'off' (force linting on or off, otherwise use resources for the target)
// MINIFY = 'on' or 'off' (force minification on or off, otherwise use default for the target)

var dateFormat = require('dateformat'),
  buildBaseDir = 'target',
  buildDir = buildBaseDir + '/common',
  userName = (process.env.VAGRANT_USER || process.env.SUDO_USER || process.env.USER || process.env.LOGNAME || 'UNKNOWN').toUpperCase(),
  today = new Date(),
  defaultVersion = dateFormat(today, 'yyyymmddHHMMss', true) + '-LOCAL-' + userName,
  version = process.env.VERSION || defaultVersion,
  isDebugOn = !process.env.DEBUG || process.env.DEBUG === 'on';

module.exports = {
  version: version,
  buildName: process.env.BUILD_NAME || 'common',
  buildBaseDir: buildBaseDir,
  buildDir: buildDir,
  resourceDir: buildDir + '/' + (isDebugOn ? 'latest' : version),
  isLintingOn: process.env.LINT === 'on', // Default to false
  isCleaningOn: !process.env.CLEAN || process.env.CLEAN === 'on', // Default to true
  isMinifying: process.env.MINIFY === 'on', // Default to false
  isDebugOn: isDebugOn,  // Default to false
  isShowingSizes: parseInt(process.versions.node) >= 4 && process.env.SHOW_SIZES !== 'off', // Don't show sizes for old versions of node that don't support gulp-size
  isGeneratingSourceMaps: process.env.SOURCEMAPS ? (process.env.SOURCEMAPS === 'on') : isDebugOn, // Default to same as debug state
  isShowingGzipSize: process.env.SHOW_GZIP_SIZE === 'on',
  isLocal: process.env.LOCAL === 'on',
  RASTER_GLOB: ['source/images/**/*', '!*.svg'],
  EARCONS_GLOB: ['source/earcons/**/*.aac', 'source/earcons/**/*.mp3', 'source/earcons/**/*.ogg' ],
  HTML_COMPILATION_GLOB: ['source/html/**/*.hbs', 'source/html/**/*.json'],  // Anything that may affect final html, including .hbs, .json
  HTML_PLAIN_GLOB: 'source/html/*.html',
  CSS_GLOB: 'source/css/**/*.css',
  SVG_GLOB: 'source/images/**/*.svg'
};

