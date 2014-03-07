sitecues.def('custom001', function (module, callback, log) {
  sitecues.use('custom', function (custom) {

    custom.register({
      module: 'picker',
      customId: 'custom001',
      func: function (event) {

      }  
    });

    callback();

  });

});