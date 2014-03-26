/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_EQ-1553
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1553
 * Description : 
 * 
*/
sitecues.def(function (module, callback, log) {
  sitecues.use('custom', function (custom) {
    
    custom.register('mouse-highlight/roles', function () {
      var ignoredList = [
        '#cs_control_161910 img',
        // add more selectors to ignore list here...
      ];
      // Merge array with another array.
      var selectorsList = this.roles.ignore.selectors;
      selectorsList.push.apply(selectorsList, ignoredList);

    });

    callback();
  });
});