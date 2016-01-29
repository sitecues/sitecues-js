define(
    [
        './Base',
        'utility/Poll',
        'utility/Events',
        'utility/math',
        'core/constants'
    ],
    function (Base, Poll, Events, math, constants) {
        'use strict';

        class Wait extends Base {

            constructor(remote, browserUtil) {
                super(remote);
                this.browserUtil = browserUtil;
                this.poll    = new Poll(remote);   //Polls browser environment for values, elements, etc.
                this.events  = new Events(remote); //Events utility, binds listeners and waits for events
            }

            forSitecuesToInitialize() {
                var state = constants.READY_STATE;

                return this.remote
                    .setExecuteAsyncTimeout(8000)
                    .executeAsync(function (state, done) {
                        var sitecues = window.sitecues = window.sitecues || {};
                        if (sitecues.readyState === state.COMPLETE) {
                            done('used ready state');
                        }
                        else if (typeof sitecues.onReady === 'function') {
                            throw new Error('onReady is already assigned a function:', JSON.stringify(sitecues.onReady));
                        }
                        else {
                            sitecues.onReady = function () { done('onReady callback'); };
                        }
                    }, [state])
                  //For debugging
                    .then(function (msg) {
                        console.log(msg);
                    })
            }

            forTransformToComplete(selector, wait, pollInterval) {
                var transform = this.browserUtil.getTransformAttributeName();
                return this.poll.untilElementStabilizes(
                    selector, wait, pollInterval, null, [transform]
                );
            }

            forElementToStopMoving(selector, wait, pollInterval) {
                return this.poll.untilElementStabilizes(
                    selector, wait, pollInterval, null, null, ['width', 'height', 'top', 'left']
                );
            }

            forEvent(event, args, wait) {
                //If we aren't concerned with event arguments, you can call wait.forEvent with just the event name and timeout
                if (!wait && math.isNonNegativeFiniteNumber(args)) {
                    wait = args;
                    args = null;
                }

                //Allow the caller to pass a single argument outside of an array, but ensure that wait is valid
                if ((args || args === 0)
                    && !Array.isArray(args)
                    && math.isNonNegativeFiniteNumber(wait)
                    && arguments.length === 3) {
                    args = [args];
                }

                return this.events.waitFor(event, args, wait);
            }

            bindEventListener(event) {
                return this.events.bindListener(event);
            }

        }

        return Wait;
    }
);