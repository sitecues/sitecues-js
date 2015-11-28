define(
    [
        './Base',
        'core/bp/constants'
    ],
    function (Base, constants) {
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
                    .executeAsync(function (done) {
                        sitecues.on('bp/did-expand', function () {
                            done();
                        })
                    })
                    .moveMouseTo()
                    .then(function () {
                        for (let i = 0; i < clicks; i++) {
                            remote
                                .clickMouseButton(0)
                                .executeAsync(function (done) {
                                    sitecues.on('zoom', function () {
                                        done();
                                    });
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
