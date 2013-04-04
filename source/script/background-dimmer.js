/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
eqnx.def('background-dimmer', function (backgroundDimmer, callback) {

    // Get dependencies
    eqnx.use('jquery', function ($) {

        backgroundDimmer.kDimmerId = 'eqnx-eq360-bg';
        backgroundDimmer.kDimmingColor = '#000000';
        backgroundDimmer.kDimmingOpacity = 0.65;
        backgroundDimmer.kDimmingSpeed = 400;
        backgroundDimmer.dimBackgroundContent = function (zIndex) {
            if ($('#' + this.kDimmerId).length < 1) {
                var dimmerDiv = document.createElement('div');
                dimmerDiv.id = this.kDimmerId;
                $(dimmerDiv).css({
                    zIndex: zIndex.toString(),
                    backgroundColor: this.kDimmingColor,
                    opacity: '0'
                }).css({
                    opacity: this.kDimmingOpacity.toString()
                }).appendTo(document.body);
            }
        };
        backgroundDimmer.removeDimmer = function () {
            $('#' + this.kDimmerId).remove();
        };

        // Done.
        callback();

    });
});