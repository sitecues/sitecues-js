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
                    .pressKeys(keys.SPACE)     // hit the spacebar, to open the Lens
                    .setFindTimeout(20)        // the Lens has this many milliseconds to come into existence
                    .findById(Lens.ID)
                        .executeAsync(         // run an async callback in the remote browser
                            function (event, done) {
                                sitecues.on(event, done);  // use our event system to know when the Lens is ready
                            },
                            [Lens.READY_EVENT]
                        );
            }

            close() {
                return this.remote
                    .pressKeys(keys.SPACE)       // close the Lens
                    .setExecuteAsyncTimeout(1200)
                    .executeAsync(
                        function (event, id, done) {
                            sitecues.on(event, function () {
                                done(
                                    document.getElementById(id)
                                );
                            });
                        },
                        [Lens.CLOSED_EVENT, Lens.ID]
                    )
            }
        }

        Lens.ID = 'sitecues-hlb';
        Lens.READY_EVENT = 'hlb/ready';
        Lens.CLOSED_EVENT = 'hlb/closed';

        return Lens;
    }
);
