define(
    [
        './Base',
        'utility',
        'core/bp/constants'
    ],
    function (Base, utility, constants) {
        'use strict';

        class Panel extends Base {

            constructor(remote) {
                super(remote);
                this.viewer = utility.createPageViewer(remote);
            }

            clickLargeA(clicks) {
                const remote = this.remote,
                      viewer = this.viewer;

                return remote
                    .findById(constants.LARGE_A_ID)
                    .moveMouseTo()
                    .click()
                    .then(function () {
                        return viewer
                            .waitForElementToFinishAnimating('#' + constants.LARGE_A_ID, 4000, 200);
                    })
                    .moveMouseTo()
                    .then(function () {
                        for (let i = 0; i < clicks; i++) {
                            remote
                                .clickMouseButton(0)
                        }
                    })
                    .end();
            }
        }

        return Panel;
    }
);
