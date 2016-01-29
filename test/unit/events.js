define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/events'
    ],
    function (tdd, assert, events) {

        'use strict';

        var suite      = tdd.suite
        ,   test       = tdd.test
        ,   beforeEach = tdd.beforeEach;

        suite('Events module', function () {

            beforeEach(function () {
                events.off();
            })

            test('All handlers are removed when we call events.off with no arguments', function () {
                var wereHandlersRun = false
                ,   deferred = this.async(1000);

                events.on('one', function () {
                    wereHandlersRun = true;
                })

                events.on('two', function () {
                    wereHandlersRun = true;
                })

                events.off();

                events.emit('one');
                events.emit('two');
                deferred.callback(function () {
                    assert.isFalse(wereHandlersRun, 'A handler was run despite calling events.off with a wildcard');
                })();
            })

            //A test verifying that callbacks are called successfully on core.emit
            test('Event handlers are called when we emit events', function () {
                var deferred = this.async(1000);
                events.on('event', deferred.callback(function () {}));
                events.emit('event');
            });

            test('Handlers for different events are invoked in the order their events are emitted', function () {
                var wasHandlerRun
                ,   deferred = this.async(1000);

                events.on('two', deferred.callback(function () {
                    assert.isTrue(wasHandlerRun, 'Preceding emitted event handler hasn\'t run yet');
                }));

                events.on('one', function () {
                    wasHandlerRun = true;
                });

                events.emit('one');
                events.emit('two');
            });

            ////A test verifying that callbacks are invoked in the order that they are bound
            test('Handlers for the same event are invoked in the order they are bound', function () {
                var wasHandlerRun
                ,   deferred = this.async(1000);

                events.on('event', function () {
                    wasHandlerRun = true;
                });

                events.on('event', deferred.callback(function () {
                    assert.isTrue(wasHandlerRun, 'Preceding event handler has not run.');
                }));

                events.emit('event');
            });

            //A test to verify that emitted arguments are passed to event callbacks
            test('Arguments emitted with the event are passed to the event handler', function () {
                var deferred = this.async(1000)
                ,   args     = [
                        'arg1',
                        2,
                        {},
                        []
                    ];

                events.on('one', function () {
                    assert.strictEqual(0, arguments.length, 
                        'Events emitted with no arguments should not pass arguments to their handlers');
                });

                events.on('two', deferred.callback(function () {
                    assert.strictEqual(args.length, arguments.length,
                        'Event handler did not received the number of arguments expected');
                    assert.strictEqual(args[0], arguments[0], 'Event did not receive string argument');
                    assert.strictEqual(args[1], arguments[1], 'Event did not receive number argument');
                    assert.strictEqual(args[2], arguments[2], 'Event did not receive object literal argument');
                    assert.strictEqual(args[3], arguments[3], 'Event did not receive array argument');
                    events.off();
                }));

                events.emit('one');
                events.emit('two', args[0], args[1], args[2], args[3]);
            });

            //A test to verify that callbacks are removed when we call core.off
            test('Event handlers are removed when we call events.off for a specific event and handler', function () {
                var wasHandlerOneRun = false
                ,   wasHandlerTwoRun = false
                ,   deferred = this.async(1000)
                ,   handler1  = function () {
                        wasHandlerOneRun = true;
                    }
                ,   handler2 = function () {
                        wasHandlerTwoRun = true;
                    };

                events.on('done', deferred.callback(function () {
                    assert.isFalse(wasHandlerOneRun, 'Handler was run despite removing all handlers for that event');
                }));

                events.on('one', handler1);
                events.off('one', handler1);
                events.emit('one');

                events.on('two', handler1);
                events.off('two');
                events.emit('two');

                events.emit('done');
            })

        });

});