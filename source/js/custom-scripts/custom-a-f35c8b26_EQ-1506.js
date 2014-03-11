  /**
   * CustomId    : custom-a-f35c8b26_EQ-1506
   * IssueLink   : https://equinox.atlassian.net/browse/EQ-1506
   * Description : This file fixes picker for rotating slider on calstate home page.
   */

  sitecues.def('custom-a-f35c8b26_EQ-1506', function (module, callback, log) {

    sitecues.use('custom', function (custom) {
      custom.register({
        module   : 'mouse-highlight/picker',
        customId : 'custom-a-f35c8b26_EQ-1506',

        func: function (event) {
            this.PICK_ME_FIRST = [{
              'url'      : 'calstate.edu',
              'selector' : '#slider',
              'enabled'  : true
            }];

        }
          
      });

      callback();
    });
  });