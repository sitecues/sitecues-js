define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        class Lens extends Base {

            constructor(remote) {
                super(remote);
            }

            open() {
                return this.remote
                    .pressKeys(keys.SPACE)     // hit the spacebar, to open the HLB
                    .setFindTimeout(20)        // the HLB has this many milliseconds to come into existence
                    .findById('sitecues-hlb')
                        .executeAsync(         // run an async callback in the remote browser
                            function (done) {
                                sitecues.on('hlb/ready', done);  // use our event system to know when the HLB is ready
                            }
                        );
            }
        }

        return Lens;
    }
);
