define(
    [
        './Base'
    ],
    function (Base) {

        'use strict';

        class Events extends Base {

            constructor(remote) {
                super(remote);
            }

            bindListener(event) {
                return this.remote
                    .execute(
                        function (event) {
                            var testNamespace  = window.sitecuesTestingNamespace = window.sitecuesTestingNamespace || {},
                                eventNamespace;

                            if (testNamespace[event]) {
                                throw new Error('Event namespace is in use');
                            }
                            else if (typeof sitecues.on !== 'function') {
                                throw new Error('Sitecues event system has not been initialized');
                            }
                            else {
                                eventNamespace = testNamespace[event] = {};
                                eventNamespace.instances = [];
                            }

                            function listener() {
                                if (arguments.length) {
                                    //Save arguments passed to each instance of event
                                    eventNamespace.instances.push({
                                        args : Array.prototype.slice.call(arguments)
                                    });
                                }
                                else {
                                    eventNamespace.instances.push({ args : [] });
                                }
                            }

                            eventNamespace.listener = listener;
                            sitecues.on(event, listener);
                        },
                        [event]
                    )
            }

            // NOTE: requiredArgs only works with primitive values,
            // it's not possible to pass values by reference to the browser environment
            waitFor(event, requiredArgs, timeout) {
                return this.remote
                    .setExecuteAsyncTimeout(timeout)
                    .executeAsync(
                        function (event, requiredArgs, done) {
                            var testNamespace  = window.sitecuesTestingNamespace,
                                eventNamespace = testNamespace[event];

                            if (!testNamespace || !eventNamespace) {
                                throw new Error(
                                    'Sitecues testing namespace should have been initialized before waiting for event.'
                                );
                            }

                            function resolveCallback() {
                                resolve(eventNamespace.instances);
                            }

                            if (eventNamespace.instances.length) {
                                resolve(eventNamespace.instances);
                            }
                            else {
                                sitecues.on(event, resolveCallback);
                            }

                            function resolve(events) {
                                var i, j, args, matches;

                                // If we aren't checking for arguments passed to the event, stop waiting
                                if (!requiredArgs) {
                                    sitecues.off(event, eventNamespace.listener);
                                    sitecues.off(event, resolveCallback);
                                    testNamespace[event] = undefined;
                                    //FOR TEST DEBUGGING
                                    done(event + ' ' + JSON.stringify(events[0].args));
                                }

                                // For each event fired between the the binding of the event listener and the calling of resolve
                                // compare each instances' passed arguments to requiredArgs
                                for (i = 0; i < events.length; i++) {
                                    matches = true;
                                    args = events[i].args;
                                    // If the number of arguments passed to the event doesn't match
                                    // the number of arguments we're looking for, skip the event
                                    if (args.length !== requiredArgs.length)
                                        continue;

                                    // Compare arguments passed to the event against the values we're looking for, in order
                                    for (j = 0; j < args.length; j++) {
                                        matches = matches && args[j] === requiredArgs[j];
                                    }

                                    if (matches) {
                                        sitecues.off(event, eventNamespace.listener);
                                        sitecues.off(event, resolveCallback);
                                        testNamespace[event] = undefined;
                                        done(args);
                                    }
                                }
                            }

                        },
                        [event, requiredArgs]
                    );
                    //.then(function (data) {
                    //    console.log('event args', data);
                    //});
            }
        }

        return Events;
    }
);
