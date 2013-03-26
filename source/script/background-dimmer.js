/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
eqnx.def('background-dimmer', function (backgroundDimmer, callback) {

    // Get dependencies
    eqnx.use('jquery', function ($) {

        backgroundDimmer.kDimmerId = 'eq360-bg';
        backgroundDimmer.kDimmingColor = '#000000';
        backgroundDimmer.kDimmingOpacity = 0.5;
        backgroundDimmer.kDimmingSpeed = 400;
        backgroundDimmer.dimBackgroundContent = function (zIndex) {
            if ($('#' + this.kDimmerId).length < 1) {
                var dimmerDiv = document.createElement('div');
                dimmerDiv.id = this.kDimmerId;
                $(dimmerDiv).css({
                    zIndex: zIndex.toString(),
                    backgroundColor: this.kDimmingColor,
                    opacity: '0'
                }).animate({
                    opacity: this.kDimmingOpacity.toString()
                }, this.kDimmingSpeed).appendTo(document.body);
            }
        };
        backgroundDimmer.removeDimmer = function () {
            $('#' + this.kDimmerId).remove();
        };

        // Done.
        callback();

    });
});