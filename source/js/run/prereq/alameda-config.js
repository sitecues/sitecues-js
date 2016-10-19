// Alameda configuration
// Must be inserted before alameda by the build process

/* globals SC_VERSION  */

sitecues._require = {
  defaultErrback: function(error) {
    var event = new CustomEvent('SitecuesRequireFailure', {detail: error});
    window.dispatchEvent(event);
  },
  waitSeconds: 30,
  baseUrl: (function(config) {
    return config.appUrl.split('/').slice(0, -3).join('/') + '/' + sitecues.version + '/js/';
  })(sitecues.everywhereConfig || sitecues.config),
  map: {
    '*': {
      '$': 'page/jquery/jquery'
    }
  }
};
