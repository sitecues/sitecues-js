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
          var ignoredList = [
              '#cs_control_161910',
              '#cs_control_161910 *',
              '#cs_control_161910 img',
          ];
          this.roles.ignore.selectors.push(ignoredList);
      }
    });

    callback();
  });
});