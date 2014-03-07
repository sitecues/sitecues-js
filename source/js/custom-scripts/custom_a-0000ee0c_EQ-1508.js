/**
 * Customer-Customization File - custom_a-0000ee0c_EQ-1508
*/
sitecues.def('custom_a-0000ee0c_EQ-1508', function (module, callback, log) {
  sitecues.use('custom', function (custom) {
    
    custom.register({
      module   : 'mouse-highlight/picker',
      customId : 'custom_a-0000ee0c_EQ-1508',
      func: function (event) {
        console.log(123123);
      }
    });

    callback();
  });
});