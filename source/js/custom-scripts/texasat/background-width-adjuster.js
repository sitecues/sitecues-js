/**
 * Customer-Customization File
 * CustomId    : custom_a-c27fa71d_SC-1891
 * IssueLink   : https://equinox.atlassian.net/browse/SC-18891
 * Description : workaround for the incredible shrinking blue background
 *               Does not seem to be necessary in new smooth body zoom code
*/

// Make sure the background covers the area needed
sitecues.def(function (module, callback) {
  sitecues.use('jquery', function ($) {
    sitecues.on('zoom', function (zoom) {
      $('#top_bkg').css('width', (100 * zoom) + '%');
    });
    callback();
  });
});


