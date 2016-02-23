define(
    [
        './Base',
        'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
        'hlb/constants'
    ],
    function (Base, key, constant) {

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
                    // The Lens has this many milliseconds to come into existence.
                    .setExecuteAsyncTimeout(4000)
                    .then(function () {
                        return wait
                            .bindEventListener(Lens.event.READY);
                    })
                    // Open the lens.
                    .pressKeys(key.SPACE)
                    .then(function () {
                        return wait
                            .forEvent(Lens.event.READY, 4000);
                    });
            }

            // Destroy the Lens and wait for its animation to finish.
            close() {
                return this.remote
                    // The Lens has this many milliseconds to disappear from the DOM.
                    .setExecuteAsyncTimeout(4000)
                    // Close the Lens.
                    .pressKeys(key.SPACE)
                    .waitForDeletedById(Lens.ID);
            }
        }

        Lens.ID = constant.HLB_ID;

        Lens.event = {
            READY  : 'hlb/ready',
            CLOSED : 'hlb/closed'
        };

        return Lens;
    }
);
