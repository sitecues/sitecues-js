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
                return this.remote
                    .setExecuteAsyncTimeout(4000)  // the Lens has this many milliseconds to come into existence
                    .pressKeys(keys.SPACE)         // open the Lens
                    .executeAsync(                 // run an async callback in the remote browser
                        function (event, done) {
                            sitecues.on(event, function () {
                                done();
                            });
                        },
                        [Lens.events.READY]
                    );
            }

            // Destroy the Lens and wait for its animation to finish.
            close() {
                return this.remote
                    .setExecuteAsyncTimeout(4000)  // the Lens has this many milliseconds to disappear from the DOM
                    .pressKeys(keys.SPACE)         // close the Lens
                    .executeAsync(
                        function (event, done) {
                            sitecues.on(event, function () {
                                done();
                            });
                        },
                        [Lens.events.CLOSED]
                    );
            }

            // Open the Lens without waiting for any animation.
            instantOpen() {
                return this.remote
                    .setFindTimeout(400)    // the Lens has this many milliseconds to come into existence
                    .pressKeys(keys.SPACE)  // open the Lens
                    .findById(Lens.ID)      // get the Lens!
                        .end();
            }
        }

        Lens.ID     = 'sitecues-hlb';
        Lens.events = {
            READY  : 'hlb/ready',
            CLOSED : 'hlb/closed'
        };

        return Lens;
    }
);
