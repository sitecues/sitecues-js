/* Common library config */

'use strict';

var extend = require('extend'),
  path = require('path');

function getConfig(baseConfig) {
  function getGlob(suffix) {
    return baseConfig.librarySourceDir + '/' + suffix;
  }

  var config = extend(true, {}, baseConfig, {
    // Production versions have resources in a folder named by the version
    resourceFolderName: baseConfig.isDebugOn ? '.' : baseConfig.version,
    isLocal: process.env.LOCAL === 'on',  // Common library -- default is non-local
    isBuildingVersionMap: true,
    autoSpeechStrategy: process.env.AUTO_SPEECH || 'preferNetwork',
    allowBrowserNetworkSpeech: process.env.BROWSER_NETWORK_SPEECH === 'on', // Allow window.speechSynthesis via network -- off by default
    audioCueDir: process.env.CUES === 'off' ? null : path.join(baseConfig.librarySourceDir, 'js', 'locale-data', 'cue'),
    jsGlob: getGlob('js/**/*.js'),
    rasterGlob: [ getGlob('images/**/*.png'), getGlob('images/**/*.cur') ],
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