define(
    [
        './Base',
        'page/highlight/constants'
    ],
    function (Base, constants) {

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
                            .bindEventListener(Highlight.TOGGLE_EVENT);
                    })
                    .findByCssSelector(selector)
                        .moveMouseTo()
                        .end()
                    .executeAsync(function (moduleId, selector, usePicker, done) {
                        sitecues.require([moduleId], function (highlight) {
                            highlight.init();
                            highlight.highlight(selector, usePicker);
                            done();
                        });
                    }, [Highlight.MODULE_ID, selector, usePicker])
                    .then(function () {
                        return wait
                            .forEvent(Highlight.TOGGLE_EVENT, true, 8000);
                    });
            }
        }

        Highlight.MODULE_ID    = 'page/highlight/highlight';
        Highlight.TOGGLE_EVENT = constants.HIGHLIGHT_TOGGLE_EVENT;

        return Highlight;
    }
);