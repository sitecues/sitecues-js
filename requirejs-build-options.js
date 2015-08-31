({
  generateSourceMaps: true,
  preserveLicenseComments: false,
  modules: [
    {
      name: 'sitecues',
      include : [
        '../../build-config/config.js',
        'core/sitecues',
        'core/launch',
        '../../../node_modules/requirejs/require.js',
        'bp/bp',
        'keys/keys'
      ],
      create: true,
      namespace: 'sitecues',
      insertRequire: ['../../build-config/config.js', 'core/sitecues']
    },
    {
      name: 'utils',
      create: true,
      include: [
        'util/jquery',
        '$',
        'util/common',
        'util/jquery-utils'
      ],
      exclude: [
        'util/element-classifier'
      ]
    },
    {
      name: 'bp-expanded',
      create: true,
      include: [
        'bp/controller/slider-controller',
        'bp/controller/focus-controller',
        'bp/controller/shrink-controller',
        'bp/view/elements/tts-button',
        'bp/view/elements/more-button',
        'bp/view/elements/secondary/secondary-panel'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/common',
        'util/jquery-utils',
        'util/transform',
        'conf/user/manager'
      ]
    },
    {  // We could split into audio and zoom features
      name: 'page-features',
      create: true,
      include: [
        'mouse-highlight/mouse-highlight',
        'audio/audio-cues',
        'audio/audio',
        'mouse-highlight/move-keys',
        'zoom/zoom',
        'hpan/hpan',
        'zoom/fixed-position-fixer',
        'keys/focus',
        'cursor/cursor'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/common',
        'util/jquery-utils',
        'util/transform',
        'conf/site',
        'conf/user/manager'
      ]
    },
    {
      name: 'hlb',
      create: true,
      include: [
        'hlb/hlb'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/common',
        'util/jquery-utils',
        'conf/site',
        'conf/user/manager',
        'util/geo',
        'util/transform'
      ]
    },
    {
      name: 'themes',
      create: true,
      include: [
        'theme/color-engine',
        'theme/color-choices',
        ,'theme/img-classifier.js'
      ],
      exclude: [
        'locale/locale',
        'util/platform',
        'util/color',
        'bp/constants',
        'bp/model/state',
        'bp/helper',
        'util/jquery',
        'util/common',
        'util/jquery-utils',
        'conf/site',
        'conf/user/manager',
        'style-service/user-agent-css.js',
        'conf/site.js',
        'style-service/media-queries.js',
        'style-service/css-aggregator.js',
        'style-service/style-service.js',
        'util/transform.js',
        'zoom/zoom-forms.js',
        'zoom/zoom.js'
      ]
    }
  ],
  onBuildRead: function(module, path, contents) {
    if (module.indexOf('/requirejs') > 0) {
      var loaderConfig = fs.readFileSync('requirejs-loader-config.js', 'utf8');
      // Prepend our runtime configuration to the loader itself,
      // so that we can use options like "skipDataMain" in it.
      return loaderConfig + contents;
    }

    return contents;
  },
  onModuleBundleComplete: function (data) {
    var includedStr = data.included.join("','");
    includedStr = includedStr.replace(/\.js/g, ''); // Remove .js
    fs.appendFileSync('target/build-config/sitecues-bundles.js', "\n    '" + data.name + "': ['" + includedStr + "'],");
  },
  map: {
    // All modules get 'jquery-private' when they ask for '$',
    // so that we can secretly return a customized value which
    // implements .noConflict() to avoid puking on customers.
    '*': {
      '$': 'util/jquery-private'
    }
  },
  paths: {
    jquery: 'util/jquery'
  },
  namespace: 'sitecues',
  useStrict: true,
  uglify2: {
    compress: {
      dead_code: true
    },
    mangle: true
  }
})
