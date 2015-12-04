define(
    [
        './Base',
        'utility',
        'core/bp/constants'
    ],
    function (Base, utility, constants) {
        'use strict';

        class Panel extends Base {

            constructor(remote, viewer, input, browser) {
                super(remote);
                this.viewer  = viewer;
                this.input   = input;
                this.browser = browser;
            }

            clickSmallA(clicks) {
                return this.clickZoomControl('#' + constants.SMALL_A_ID, clicks);
            }

            clickLargeA(clicks) {
                return this.clickZoomControl('#' + constants.LARGE_A_ID, clicks);
            }

            pressSmallA() {
                return this.pressZoomControl('#' + constants.SMALL_A_ID);
            }

            pressLargeA() {
                return this.pressZoomControl('#' + constants.LARGE_A_ID);
            }

            dragSlider(zoom) {
                const remote  = this.remote,
                      viewer  = this.viewer,
                      browser = this.browser,
                      thumbSelector = '#' + constants.ZOOM_SLIDER_THUMB_ID;
                return remote
                    .findByCssSelector(thumbSelector)
                    .moveMouseTo()
                    .click()
                    .then(function () {
                        return viewer
                            .waitForElementToFinishAnimating(thumbSelector, 4000, 200)
                            .moveMouseTo()
                            .pressMouseButton(0)
                            .then(function () {
                                return browser.getTransformAttributeString();
                            })
                    })
                    .then(function (transform) {
                        zoom = (zoom < 0) ? 0 : (zoom > 3) ? 3 : zoom;
                        function moveSlider(distance) {
                            return remote
                                .moveMouseTo(distance, 0)
                                .execute(function (transform, desiredScale) {
                                    var matrix = getComputedStyle(document.body)[transform],
                                        scale  = Number(matrix.substring(7).split(',')[0]),
                                        diff   = desiredScale - scale;
                                    if (diff > .05) {
                                        return 2;
                                    }
                                    else if (diff < -.05) {
                                        return -2;
                                    }
                                    else {
                                        return false;
                                    }
                                }, [transform, zoom])
                                .then(function (result) {
                                    if (result) {
                                        return moveSlider(result);
                                    }
                                    else {
                                        return remote;
                                    }
                                })

                        }
                        return moveSlider(0);
                    })
                    .releaseMouseButton(0)
                    .end()
            }

            pressZoomControl(selector) {
                const viewer   = this.viewer;
                return this.remote
                    .findByCssSelector(selector)
                    .moveMouseTo()
                    .click()
                    .then(function () {
                        return viewer
                            .waitForElementToFinishAnimating(selector, 4000, 200);
                    })
                    .moveMouseTo()
                    .pressMouseButton(0)
                    .then(function () {
                        return viewer
                            .waitForTransformToStabilize('body', 4000, 200)
                            .releaseMouseButton(0)
                            .end()
                    })
            }

            clickZoomControl(selector, clicks) {
                const remote   = this.remote,
                      viewer   = this.viewer;

                return remote
                    .findByCssSelector(selector)
                    .moveMouseTo()
                    .click()
                    .then(function () {
                        return viewer
                            .waitForElementToFinishAnimating(selector, 4000, 200);
                    })
                    .moveMouseTo()
                    .then(function () {
                        return remote
                            .then(function () {
                                function click(clickCount, total) {
                                    return remote
                                        .clickMouseButton(0)
                                        .then(function () {
                                            return viewer
                                                .waitForTransformToStabilize('body', 4000, 200)
                                                .then(function () {
                                                    if (clickCount === total) {
                                                        return remote;
                                                    }
                                                    else {
                                                        clickCount++;
                                                        return click(clickCount, total);
                                                    }
                                                })
                                        })
                                }
                                return click(0, clicks);
                            })
                    })
                    .end();
            }
        }

        return Panel;
    }
);
