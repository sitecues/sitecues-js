/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_EQ-1508
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1508
 * Description : 
 * 
*/
sitecues.def(function (module, callback, log) {
  sitecues.use('custom', function (custom) {
    
    custom.register('mouse-highlight/picker', function (event) {
      return; // EQ-1553: temporary fix requested by EEOC
      this.PICK_ME_FIRST = [{
        'url'      : 'eeoc.gov',
        'selector' : '#CS_Element_bigbox',
        'enabled'  : true
      }];
    });

    callback();
  });
});