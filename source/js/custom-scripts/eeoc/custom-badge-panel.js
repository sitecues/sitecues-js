/**
 * Customer-Customization File
 * CustomId    : custom_a-0000ee0c_SC-2040
 * IssueLink   : https://equinox.atlassian.net/browse/EQ-1508
 * Description : Custom color palette for badge and panel
 *
*/
define(['custom'], function (custom) {
  'use strict';

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

});