// sitecues JS modules

'use strict';

var config = require('./build-config'),
  JS_SOURCE_DIR = config.librarySourceDir + '/js';

var AMD_CONFIGS = {
  'core': {
    out: config.buildDir + '/js/sitecues.js',
    wrap: {   // Override default wrap.start to add runtime config
      start: config.runtimeConfig + "'use strict';\n"
    },
    include: [
      'core/alameda-custom'  // Was: '../../../node_modules/alameda/alameda.js'
    ],
    insertRequire: [ 'core/core' ]
  },
  'locale-data': {
    doDisableBundling: true,
    baseUrl: JS_SOURCE_DIR + '/locale-data',
    dir: config.resourceDir + '/js/locale-data'
  },
  'bp-expanded': {
    exclude: [
      'core/locale',
      'core/platform',
      'core/bp/constants',
      'core/bp/model/state',
      'core/bp/helper',
      'core/util/xhr',
      'page/util/common',
      'page/zepto/zepto',
      'core/metric',
      'core/conf/urls',
      'core/conf/user/manager',
      'page/zoom/zoom'
    ]
  },
  'bp-secondary': {
    exclude: [
      'core/locale',
      'core/platform',
      'bp-expanded/bp-expanded',
      'core/bp/constants',
      'core/bp/model/state',
      'core/bp/helper',
      'core/bp/view/markup-finalizer',
      'core/util/xhr',
      'page/util/common',
      'bp-expanded/view/transform-animate',
      'bp-expanded/view/transform-util',
      'page/cursor/cursor',
      'core/metric',
      'core/conf/urls',
      'core/conf/user/manager'
    ]
  },
  'page': {
    include: [
      'page/zepto/zepto'
    ],
    exclude: [
      'core/locale',
      'core/platform',
      'core/bp/constants',
      'core/bp/model/state',
      'core/bp/helper',
      'core/util/xhr',
      'core/metric',
      'core/conf/urls',
      'core/conf/site',
      'core/conf/user/manager',
      'core/conf/user/storage'
    ]
  },
  'hlb': {
    exclude: [
      'core/locale',
      'core/platform',
      'core/bp/constants',
      'core/bp/model/state',
      'core/bp/helper',
      'core/util/xhr',
      'page/util/common',
      'page/zepto/zepto',
      'core/conf/site',
      'core/conf/user/manager',
      'core/metric',
      'core/conf/urls',
      'page/util/element-classifier',
      'page/util/geo'
    ]
  },
  'theme': {
    exclude: [
      'core/locale',
      'core/platform',
      'page/util/color',
      'core/bp/constants',
      'core/bp/model/state',
      'core/bp/helper',
      'core/util/xhr',
      'page/util/common',
      'page/zepto/zepto',
      'core/conf/urls',
      'core/conf/site',
      'core/conf/user/manager',
      'page/style-service/user-agent-css.js',
      'core/conf/site.js',
      'page/style-service/media-queries.js',
      'page/style-service/css-aggregator.js',
      'page/style-service/style-service.js',
      'core/metric',
      'zoom-forms/zoom-forms.js',
      'page/zoom/zoom.js'
    ]
  },
  'audio': {
    exclude: [
      'core/metric',
      'page/zepto/zepto'
    ]
  },
  'audio-cues': {
    exclude: [
      'audio/audio',
      'core/metric',
      'core/conf/user/manager',
      'page/zepto/zepto'
    ]
  },
  'status': {
    exclude: [
      'core/conf/user/manager',
      'core/util/xhr',
      'core/conf/urls'
    ]
  },
  'info': {
    exclude: [
      'page/util/color',
      'core/locale',
      'hlb/dimmer',
      'core/conf/urls'
    ]
  },
  'pick-debug': {
  },
  'labs': {
    exclude: [
      'core/conf/user/manager'
    ]
  },
  'inverter': {
    exclude: [
      'core/conf/user/manager',
      'page/style-service/style-service',
      'core/platform'
    ]
  },
  'zoom-forms': {
    exclude: [
      'core/conf/user/manager',
      'core/platform'
    ]
  }
};

var sourceFolders = Object.keys(AMD_CONFIGS);

module.exports = {
  amdConfigs: AMD_CONFIGS,
  sourceFolders: sourceFolders
};