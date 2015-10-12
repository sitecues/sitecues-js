define(
    [
        './Base',
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
    ],
    function (Base, keys) {

        'use strict';

        class Lens extends Base {

            constructor(remote) {
                super(remote);
            }

            // Open the Lens and wait for its animation to finish.
            open() {
                return this.instantOpen()
                        .executeAsync(         // run an async callback in the remote browser
                            function (event, done) {
                                sitecues.on(event, function () {
                                    done();
                                });
                            },
                            [Lens.READY_EVENT]
                        );
            }

            // Destroy the Lens and wait for its animation to finish.
            close() {
                return this.remote
                    .setExecuteAsyncTimeout(4000)
                    .pressKeys(keys.SPACE)       // close the Lens
                    .executeAsync(
                        function (event, id, done) {
                            sitecues.on(event, function () {
                                done(
                                    document.getElementById(id)
                                );
                            });
                        },
                        [Lens.CLOSED_EVENT, Lens.ID]
                    );
            }

            // Open the Lens without waiting for any animation.
            instantOpen() {
                return this.remote
                    .setFindTimeout(100)     // the Lens has this many milliseconds to come into existence
                    .setExecuteAsyncTimeout(4000)  // Set in case we are used for open()
                    .pressKeys(keys.SPACE)  // open the Lens
                    .findById(Lens.ID);     // get the Lens!
            }
        }

        Lens.ID           = 'sitecues-hlb';
        Lens.READY_EVENT  = 'hlb/ready';
        Lens.CLOSED_EVENT = 'hlb/closed';

        return Lens;
    }
);
