define(
    [
        './Base',
        'utility/BrowserUtility',
        'utility/Poll',
        'utility/Events',
        'utility/math',
        'core/constants'
    ],
    function (Base, BrowserUtil, Poll, EventUtil, math, constant) {

        'use strict';

        class Wait extends Base {

            constructor(remote) {
                super(remote);
                this.browserUtil = new BrowserUtil(remote);
                // Polls browser environment for values, elements, etc.
                this.poll        = new Poll(remote);
                // Events utility, binds listeners and waits for events.
                this.eventUtil   = new EventUtil(remote);
            }

            forSitecuesToInitialize() {

                let state = constant.READY_STATE;

                return this.remote
                    .setExecuteAsyncTimeout(8000)
                    .executeAsync(
                        function (state, done) {
                            var sitecues = window.sitecues = window.sitecues || {};
                            if (sitecues.readyState === state.COMPLETE) {
                                done();
                            }
                            else if (typeof sitecues.onReady === 'function') {
                                throw new Error(
                                    'onReady is already assigned a function:',
                                    JSON.stringify(sitecues.onReady)
                                );
                            }
                            else {
                                sitecues.onReady = function () {
                                    done();
                                };
                            }
                        },
                        [state]
                    );
                    //.then(function (msg) {
                    //    console.log(msg);
                    //});
            }

            forTransformToComplete(selector, wait, pollInterval) {
                return this.poll.untilElementStabilizes(
                    selector, wait, pollInterval, null, ['transform']
                );
            }

            forElementToStopMoving(selector, wait, pollInterval) {
                return this.poll.untilElementStabilizes(
                    selector, wait, pollInterval, null, null, ['width', 'height', 'top', 'left']
                );
            }

            forEvent(event, args, wait) {
                // If we aren't concerned with event arguments, you can call wait.forEvent with just the event name and timeout
                if (!wait && math.isNonNegativeFiniteNumber(args)) {
                    wait = args;
                    args = null;
                }

                // Allow the caller to pass a single argument outside of an array, but ensure that wait is valid
                if ((args || args === 0)
                    && !Array.isArray(args)
                    && math.isNonNegativeFiniteNumber(wait)
                    && arguments.length === 3) {
                    args = [args];
                }

                return this.eventUtil.waitFor(event, args, wait);
            }

            bindEventListener(event) {
                return this.eventUtil.bindListener(event);
            }
        }

        return Wait;
    }
);
