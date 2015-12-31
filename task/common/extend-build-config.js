/* Common library config */

'use strict';

var extend = require('extend');

function getConfig(baseConfig) {
  function getGlob(suffix) {
    return baseConfig.librarySourceDir + '/' + suffix;
  }

  var config = extend(true, {}, baseConfig, {
    // Production versions have resources in a folder named by the version
    resourceFolderName: baseConfig.isDebugOn ? '.' : baseConfig.version,
    isLocal: process.env.LOCAL === 'on',  // Common library -- default is non-local
    jsGlob: getGlob('js/**/*.js'),
    rasterGlob: getGlob('images/**/*.png'),
    svgGlob: getGlob('images/**/*.svg'),
    earconsGlob: [
      getGlob('/earcons/**/*.mp3'),
      getGlob('/earcons/**/*.ogg'),
      getGlob('/earcons/**/*.aac')
    ],
    htmlGlob: getGlob('html/**/*.html'),
    templateGlob: [
      // Anything that may affect final html, including .hbs, .json
      getGlob('/html/**/*.hbs'),
      getGlob('/html/**/*.json')
    ],
    cssGlob: getGlob('css/**/*.css'),
    metaDataGlob: null // No static metadata files
  });

  return config;
}

module.exports = getConfig;