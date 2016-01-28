define(
    [
        './Base',
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'hlb/constants'

    ],
    function (Base, keys, constants) {
        'use strict';

        class Lens extends Base {

            constructor(remote, wait) {
                super(remote);
                this.wait = wait;
            }

            // Open the Lens and wait for its animation to finish.
            open() {
                const wait = this.wait;
                return this.remote
                    .setExecuteAsyncTimeout(4000)  // the Lens has this many milliseconds to come into existence
                    .then(function () {
                        return wait
                            .bindEventListener(Lens.events.READY)
                    })
                    .pressKeys(keys.SPACE)         // open the Lens
                    .then(function () {
                        return wait
                            .forEvent(Lens.events.READY, 4000)
                    })
            }

            // Destroy the Lens and wait for its animation to finish.
            close() {
                return this.remote
                    .setExecuteAsyncTimeout(4000)  // the Lens has this many milliseconds to disappear from the DOM
                    .pressKeys(keys.SPACE)          // close the Lens
                    .waitForDeletedById(Lens.ID);
            }

        }

        Lens.ID = constants.HLB_ID;

        Lens.events = {
            READY  : 'hlb/ready',
            CLOSED : 'hlb/closed'
        };

        return Lens;
    }
);
