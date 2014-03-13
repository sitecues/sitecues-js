/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_EQ-1553
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1553
 * Description : 
 * 
*/
sitecues.def('not-pick-main-image', function (module, callback, log) {
  sitecues.use('custom', function (custom) {
    custom.register({
      module   : 'mouse-highlight/roles',
      customId : 'not-pick-main-image',
      
      func: function () {
          this.roles.ignore.selectors.push('#cs_control_161910');
          this.roles.ignore.selectors.push('#cs_control_161910 *');
          this.roles.ignore.selectors.push('#cs_control_161910 img');
      }
    });

    callback();
  });
});