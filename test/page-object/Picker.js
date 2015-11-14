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
                    .executeAsync(
                        // Code to run in the remote browser.
                        function (moduleId, selector, done) {
                            sitecues.require([moduleId], function (highlight) {
                                highlight.init();
                                highlight.highlight(selector);
                                done();
                            });
                        },
                        // List of arguments to pass to the remote code.
                        [
                            picker.MODULE_ID,
                            selector
                        ]
                    );
            }
        }

        Picker.MODULE_ID = 'page/highlight/highlight';

        return Picker;
    }
);
