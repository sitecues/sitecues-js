define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        class Picker extends Base {

            constructor(remote) {
                super(remote);
            }

            highlight(selector) {
                return this.remote
                    .execute(                     // run a callback in the remote browser
                        function (selector) {
                            sitecues.highlight(selector);
                        },
                        [selector]                // list of arguments to pass to the remote code
                    );
            }
        }

        return Picker;
    }
);
