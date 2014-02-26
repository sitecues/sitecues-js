/**
 * The file that overrides/extends the basic code (hlb.js) with customized eeoc code.
 * @param {type} param1
 * @param {type} param2
 */
sitecues.def('customized/eeoc', function (custEeoc, callback, log) {
  // Get dependencies
  sitecues.use('jquery', function ( $) {

    console.log('customized/eeoc is loaded...');
    // todo: take it out to config file siteId => site
    // var siteId = site.get('site_id');
    if (window.location.host === 'eeoc.gov') {
        // Extend the function hlb.inflate()
        custEeoc.clearFloats = function($children) {
            console.log('customized/clearFloats is executed...');
            // todo: still need to find out whether it is eeoc?
            // idea: cancel clears
            // pros: general solution, the underlying content stays on the page(but is shifted)
            // cons: positining problems, the same as on techbuffalo
            // also: need to re-calculate the position? Left border goes offscreen.
            (function _rec($children) {
                if ($children.length === 0) {
                    return;
                }

                $children.each(function() {
                    $(this).css('clear') !== 'none' && $(this).css('clear', 'none');
                    return _rec($(this).children());
                });
            }($('#centercol').children()));

        };
    }
    // Done
    callback();
  });
});

