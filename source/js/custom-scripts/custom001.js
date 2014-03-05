sitecues.def('custom001', function (custom001, callback, log) {
  sitecues.use('custom', function (custom) {
  
  console.log('execute custom001.js___________________', +new Date()/1000);

    custom.register({
      module: 'hightlight-box',
      customId: 'custom001',
      func: function (event) {
        console.log('ysy!',event, this);
      }  
    });

    callback();

  });

});