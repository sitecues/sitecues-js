({
  generateSourceMaps: true,
  preserveLicenseComments: false,
  modules: [
    {
      name: 'sitecues',
      include : [
        'requirejs-loader-config.js',
        '../config/config.js',
        'require.js',
        'core',
        'launch'
      ],
      create: true,
      namespace: 'sitecues',
      insertRequire: ['core']
    },
    { name: 'locale/lang/de' },
    { name: 'locale/lang/en' },
    { name: 'locale/lang/es' },
    { name: 'locale/lang/fr' },
    { name: 'locale/lang/pl' }
  ],
  namespace: 'sitecues',
  useStrict: true,
  uglify2: {
    compress: {
      dead_code: true
    },
    mangle: true
  }
})
