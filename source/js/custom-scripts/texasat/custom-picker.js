/**
 * Customer-Customization File
 * CustomId    : custom_a-c27fa71d_SC-1884
 * IssueLink   : https://equinox.atlassian.net/browse/SC-1884
 * Description : workaround for ugly HLB, don't pick #right or #rightin
 *               Also temporary workaround for SC-1886 -- <input type="text"> issues -- don't pick them for now.
*/

sitecues.def(function (module, callback) {
  sitecues.use('custom', function (custom) {
    custom.register('mouse-highlight/picker', function (event) {
      this.provideCustomSelectors({
        ignore: '#right,#rightin'
      });
    });

    callback();
  });
});