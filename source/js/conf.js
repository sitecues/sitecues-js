// This module loads all configuration in the desired order. It then returns the conf/main
// module in it's stead.
sitecues.def('conf', function (conf, callback, log) {

  sitecues.use('conf/main', function(conf_main) {
    sitecues.use('conf/localstorage', function(conf_localstorage) {
      sitecues.use('conf/import', function(conf_import) {
        sitecues.use('conf/remote', function(conf_remote) {
          sitecues.use('conf/server', function(conf_server) {
            callback(conf_main)
          });
        });
      });
    });
  });
});
