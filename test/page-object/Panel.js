define(
    [
        './Base',
        'core/bp/constants'
    ],
    function (Base, constant) {

        'use strict';

        class Panel extends Base {

            constructor(remote, browserUtil, input, wait) {
                super(remote);
                this.wait    = wait;
                this.input   = input;
                this.browserUtil = browserUtil;
            }
            /*
            clickSmallA(clicks) {
                return this.clickZoomControl('#' + constant.SMALL_A_ID, clicks);
            }

            clickLargeA(clicks) {
                return this.clickZoomControl('#' + constant.LARGE_A_ID, clicks);
            }
            */
            pressSmallA() {
                return this.pressZoomControl(Panel.SMALL_A_SELECTOR);
            }

            pressLargeA() {
                return this.pressZoomControl(Panel.LARGE_A_SELECTOR);
            }

            dragSliderThumb(zoom) {
                const remote  = this.remote,
                      input   = this.input,
                      browserUtil = this.browserUtil;

                return input
                    .clickElement(Panel.THUMB_SELECTOR)
                    .then(function () {
                        const transform = 'transform';
                        zoom = (zoom < 1) ? 1 : (zoom > 3) ? 3 : zoom;
                        return remote
                            .execute(
                                function (selector, zoom, transform) {
                                    var matrix = getComputedStyle(document.body)[transform],
                                        currentZoom  = Number(matrix.substring(7).split(',')[0]),
                                        diff   = zoom - currentZoom,
                                        slider  = document.querySelector(selector),
                                        slideRect = slider.getBoundingClientRect();
                                        return diff / 2 * slideRect.width;
                                },
                                [Panel.SLIDER_SELECTOR, zoom, transform]
                            )
                            .then(function (offset) {
                                function moveSlider(distance) {
                                    return remote
                                        .moveMouseTo(distance, 0)
                                        .execute(function (transform, zoom) {
                                            var matrix = getComputedStyle(document.body)[transform],
                                                currentZoom  = Number(matrix.substring(7).split(',')[0]),
                                                diff   = zoom - currentZoom;
                                            if (diff > .001) {
                                                return 3;
                                            }
                                            else if (diff < -.001) {
                                                return -3;
                                            }
                                            else {
                                                return true;
                                            }
                                        }, [transform, zoom])
                                        .then(function (result) {
                                            if (result === true) {
                                                return remote;
                                            }
                                            else {
                                                return moveSlider(result);
                                            }
                                        });
                                }
                                return moveSlider(offset);
                            })
                    })
                    .then(function () {
                        return input
                            .releaseElement(Panel.THUMB_SELECTOR);
                    })
            }

            pressZoomControl(selector) {
                const wait  = this.wait,
                      input = this.input;

                return input
                    .clickElement(selector)
                    .then(function () {
                        return wait.forTransformToComplete('body', 4000, 25)
                    });
            }

            clickSliderBar(zoom) {

                const remote = this.remote,
                      wait   = this.wait;

                // Clamp zoom to within 1 and 3, inclusive.
                zoom = Math.min(Math.max(1, zoom), 3);

                return remote
                    .execute(
                        function (selector, zoom) {
                            var MAGIC_SHIFT_FACTOR = 5.2,
                                slider  = document.querySelector(selector),
                                slideRect = slider.getBoundingClientRect(),
                                // Shifts the x position on the slider relative to the zoom parameter,
                                // it ensures that we don't press the big A at the end of the slider,
                                shift   = MAGIC_SHIFT_FACTOR * zoom,

                                xOffset = Math.max(0, (zoom - 1) / 2 * slideRect.width - shift),
                                yOffset = slideRect.height / 2;
                            return [xOffset, yOffset];
                        },
                        [Panel.SLIDER_SELECTOR, zoom]
                    )
                    .then(function (offset) {
                        return remote
                            .findByCssSelector(Panel.SLIDER_SELECTOR)
                                .moveMouseTo(offset[0], offset[1])
                                .clickMouseButton(0)
                                .then(function () {
                                    return wait
                                        .forTransformToComplete('body', 8000, 25);
                                })
                                .end();
                    });
            }

            /*
            clickZoomControl(selector, totalClicks) {
                const remote   = this.remote,
                      viewer   = this.viewer;

                return remote
                    .findByCssSelector(selector)
                    .moveMouseTo()
                    .click()
                    .then(function () {
                        return viewer
                            .waitForElementToStopMoving(selector, 4000, 25);
                    })
                    .moveMouseTo()
                    .then(function () {
                        function click(clickCount) {
                            return remote
                                .clickMouseButton(0)
                                .then(function () {
                                    return viewer
                                        .waitForTransformToFinish('body', 4000, 25)
                                        .then(function () {
                                            if (clickCount === totalClicks) {
                                                return remote;
                                            }
                                            else {
                                                clickCount++;
                                                return click(clickCount);
                                            }
                                        })
                                })
                        }
                        return click(1);
                    })
                    .end();
            }
            */

        }

        Panel.THUMB_SELECTOR   = '#' + constant.ZOOM_SLIDER_THUMB_ID;
        Panel.SLIDER_SELECTOR  = '#' + constant.ZOOM_SLIDER_ID;
        Panel.SMALL_A_SELECTOR = '#' + constant.SMALL_A_ID;
        Panel.LARGE_A_SELECTOR = '#' + constant.LARGE_A_ID;

        return Panel;
    }
);
