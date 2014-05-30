  /**
   * CustomId    : custom-a-0000calstate_EQ-1506
   * IssueLink   : https://equinox.atlassian.net/browse/EQ-1506
   * Description : This file fixes picker for rotating slider on calstate home page.
   */

sitecues.def(function (module, callback, log) {
  sitecues.use('custom', function (custom) {

    custom.register('mouse-highlight/pick', function (event) {
      
      this.provideCustomSelectors({
        prefer: '#slider'
      });

    });

    callback();
  });
});