// Alameda configuration
// Must be inserted before alameda by the build process

sitecues._require = {
  defaultErrback: function(error) {
    var event = new CustomEvent('SitecuesRequireFailure', {detail: error});
    window.dispatchEvent(event);
  },
  waitSeconds: 30,
  baseUrl: (function(config, version) {
    return config.appUrl.split('/').slice(0, -3).join('/') + '/' + version + '/js/';
  })(sitecues.config, sitecues.version),
  map: {
    '*': {
      '$': 'page/jquery/jquery'
    }
  }
};
