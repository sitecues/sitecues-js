({
  preserveLicenseComments: false,
  removeCombined: true,
  namespace: 'sitecues',
  useStrict: true,
  uglify2: {
    compress: {
      dead_code: true
    },
    mangle: true
  },
  modules: [
    {
      name: 'sitecues',
      include : [
        '../../../build-config/config.js',
        'core/core',
        'core/alameda-custom.js'  // Was: '../../../node_modules/alameda/alameda.js'
      ],
      create: true,
      insertRequire: ['core/core']
    },
    {
      name: 'bp-expanded',
      create: true,
      include: [
        'bp-expanded/bp-expanded'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'page/util/common',
        'page/zepto/zepto-utils',
        'page/zepto/zepto',
        'core/metric',
        'core/conf/urls',
        'core/conf/user/manager',
        'page/zoom/zoom'
      ]
    },
    {
      name: 'bp-secondary',
      create: true,
      include: [
        'bp-secondary/bp-secondary'
      ],
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
    {  // We could split into audio and zoom features
      name: 'page',
      create: true,
      include: [
        'page/keys/keys',
        'page/keys/commands',
        'page/util/element-classifier',
        'page/highlight/highlight',
        'page/util/common',
        'page/zepto/zepto-utils',
        'page/zepto/zepto',
        'page/highlight/move-keys',
        'page/zoom/zoom',
        'page/hpan/hpan',
        'page/zoom/fixed-position-fixer',
        'page/focus/focus',
        'page/cursor/cursor'
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
        'core/conf/user/server',
        'core/conf/user/localstorage'
      ]
    },
    {
      name: 'hlb',
      create: true,
      include: [
        'hlb/hlb'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'page/util/common',
        'page/zepto/zepto-utils',
        'page/zepto/zepto',
        'core/conf/site',
        'core/conf/user/manager',
        'core/metric',
        'core/conf/urls',
        'page/util/element-classifier',
        'page/util/geo'
      ]
    },
    {
      name: 'theme',
      create: true,
      include: [
        'theme/theme',
        'theme/color-choices',
        'theme/img-classifier'
      ],
      exclude: [
        'core/locale',
        'core/platform',
        'page/util/color',
        'core/bp/constants',
        'core/bp/model/state',
        'core/bp/helper',
        'core/util/xhr',
        'page/util/common',
        'page/zepto/zepto-utils',
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
        'page/zoom/zoom-forms.js',
        'page/zoom/zoom.js'
      ]
    },
    {
      name: 'audio',
      create: true,
      include: [
        'audio/audio',
        'audio/text-select'
      ],
      exclude: [
        'core/metric',
        'page/zepto/zepto'
      ]
    },
    {
      name: 'audio-cues',
      create: true,
      include: [
        'audio-cues/audio-cues'
      ],
      exclude: [
        'audio/audio',
        'core/metric',
        'core/conf/user/manager',
        'page/zepto/zepto'
      ]
    },
    {
      name: 'status',
      create: true,
      include: [
        'status/status'
      ],
      exclude: [
        'core/conf/user/manager',
        'core/util/xhr',
        'core/conf/urls'
      ]
    },
    {
      name: 'info',
      create: true,
      include: [
        'info/info'
      ],
      exclude: [
        'page/util/color',
        'core/locale',
        'hlb/dimmer',
        'core/conf/urls'
      ]
    }
  ],
  map: {
    '*': {
      '$': 'page/zepto/zepto'
    }
  },
  onBuildRead: function(module, path, contents) {
    if (module.indexOf('/requirejs') > 0 || module.indexOf('/alameda') > 0) {
      const loaderConfig = fs.readFileSync('module-loader-config.js', 'utf8');
      // Prepend our runtime configuration to the loader itself,
      // so that we can use options like "skipDataMain" in it.
      return loaderConfig + contents;
    }

    return contents;
  },
  onModuleBundleComplete: function (data) {
    // Check for dupes
    // TODO this should use require with a state module we build instead of a global
    global.scIncludedBy = global.scIncludedBy || {};
    let index = data.included.length;
    while (index--) {
      const includedItem = data.included[index];
      if (global.scIncludedBy[includedItem]) {
        throw new Error('The module ' + includedItem + ' was included both in ' + global.scIncludedBy[includedItem] + ' and ' + data.name + '.\n' +
          'Modules must only be included once in order to avoid code duplication.');
      }
      global.scIncludedBy[includedItem] = data.name;
    }

    // Build loader config, removing .js
    let includedStr = data.included.join("','").replace(/\.js/g, '');
    fs.appendFileSync(
      'target/build-config/sitecues-bundles.js',
      "'" + data.name + "':['" + includedStr + "'],"
    );
  }
})
