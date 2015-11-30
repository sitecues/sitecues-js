define(
    [
        './Base',
        'test/util/page-viewer',
        'core/bp/constants'
    ],
    function (Base, pageViewer, constants) {
        'use strict';

        class Panel extends Base {
            constructor(hello) {
                super(hello);
            }

            clickLargeA(clicks) {
                const remote = this.remote;

                return remote
                    .findById(constants.LARGE_A_ID)
                    .moveMouseTo()
                    .click()
                    .then(function () {
                        return pageViewer
                            .waitForElementToFinishAnimating(remote, '#' + constants.MAIN_CONTENT_FILL_ID, 4000, 200);
                    })
                    .moveMouseTo()
                    .then(function () {
                        for (let i = 0; i < clicks; i++) {
                            remote
                                .clickMouseButton(0)
                                .executeAsync(function () {

                                });
                        }
                    })
                    .executeAsync(function (done) {
                        sitecues.on('zoom', function () {
                            done();
                        });
                    })
                    .end();
            }
        }

        return Panel;
    }
);
