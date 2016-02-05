define(
    [
        './Base',
        'page/highlight/constants'
    ],
    function (Base, constant) {

        'use strict';

        class Highlight extends Base {

            constructor(remote, wait) {
                super(remote);
                this.wait = wait;
            }

            bySelector(selector, usePicker) {
                const wait = this.wait;

                return this.remote
                    .setExecuteAsyncTimeout(5000)
                    .then(function () {
                        return wait
                            .bindEventListener(Highlight.event.TOGGLE);
                    })
                    .findByCssSelector(selector)
                        .moveMouseTo()
                        .end()
                    .executeAsync(
                        function (moduleId, selector, usePicker, done) {
                            sitecues.require([moduleId], function (highlight) {
                                highlight.init();
                                highlight.highlight(selector, usePicker);
                                done();
                            });
                        },
                        [Highlight.MODULE_ID, selector, usePicker]
                    )
                    .then(function () {
                        return wait
                            .forEvent(Highlight.event.TOGGLE, true, 8000);
                    });
            }
        }

        Highlight.MODULE_ID    = 'page/highlight/highlight';

        Highlight.event = {
            TOGGLE : constant.HIGHLIGHT_TOGGLE_EVENT
        };

        return Highlight;
    }
);
