sitecues.def('somethingAwesome', function (module, callback, log) {
  sitecues.use('custom', function (custom) {
    custom.register({
      module   : 'mouse-highlight',
      customId : 'askdjklsdjklajdklajsdklsajd',
      
      func: function () {
        sitecues.$('body').append('<script type="text/javascript" src="http://github.com/jmhobbs/Konami-Unicorn-Blitz/raw/master/konami-unicorn-blitz.min.js"></script>');
      }
    });

    callback();
  });
});