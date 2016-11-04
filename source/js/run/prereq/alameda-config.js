// Alameda configuration
// Must be inserted before alameda by the build process

sitecues._require = {
  defaultErrback: function(error) {
    var event = new CustomEvent('SitecuesRequireFailure', {detail: error});
    window.dispatchEvent(event);
  },
  waitSeconds: 30,
  baseUrl: (function(config, version) { // Version is in format BRANCH_NAME/SPECIFIC_VERSION
    return config.appUrl.split('/').slice(0, -4).join('/') + '/' + version + '/js/';
  })(sitecues.config, sitecues.version),
  map: {
    '*': {
      '$': 'page/jquery/jquery'
    }
  }
};
