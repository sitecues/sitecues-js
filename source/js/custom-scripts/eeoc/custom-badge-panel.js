/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_SC-2040
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1508
 * Description : Custom color palette for badge and panel
 *
*/
sitecues.def(function (module, callback) {
  'use strict';
  sitecues.use('custom', function (custom) {

    custom.register('bp/view/styles', function () {
      this.provideCustomPalette({
        'A': 'red',
        'panel': {
          'largeA': 'yellow'
        },
        'badge': {
          'wave1Off': 'green'
        }
      });
    });

    callback();
  });
});