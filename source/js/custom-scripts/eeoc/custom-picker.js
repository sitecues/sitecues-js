/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_EQ-1508
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1508
 * Description : 
 * 
*/
sitecues.def(function (module, callback) {
  sitecues.use('custom', function (custom) {
    
    custom.register('mouse-highlight/pick', function (event) {
      this.provideCustomSelectors({
        prefer: '#CS_Element_bigbox',
        disable: '#cs_control_161910 img'
      });
    });

    callback();
  });
});