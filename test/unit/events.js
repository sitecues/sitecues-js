define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/events'
    ],
    function (tdd, assert, events) {

        'use strict';

        var suite      = tdd.suite,
            test       = tdd.test,
            beforeEach = tdd.beforeEach;

        suite('Events', function () {

            beforeEach(function () {
                events.off();
            });

            test('.on() handlers are run when events are emitted', function () {

                var deferred = this.async(1000);

                events.on('event', deferred.callback(function () {}));
                events.emit('event');
            });

            test('.on() handlers for the same event are run in the order they are registered', function () {

                var deferred = this.async(1000),
                    wasHandlerRun;

                    events.on('event', function () {
                    wasHandlerRun = true;
                });

                events.on('event', deferred.callback(function () {
                    assert.isTrue(
                        wasHandlerRun,
                        'Preceding event handler has not run.'
                    );
                }));

                events.emit('event');
            });

            test('.on() handlers for different events are run in the order their events are emitted', function () {

                var deferred = this.async(1000),
                    wasHandlerRun;

                events.on('two', deferred.callback(function () {
                    assert.isTrue(
                        wasHandlerRun,
                        'Preceding emitted event handler hasn\'t run yet'
                    );
                }));

                events.on('one', function () {
                    wasHandlerRun = true;
                });

                events.emit('one');
                events.emit('two');
            });

            test('.on() handlers receive arguments from .emit()', function () {

                var deferred = this.async(1000),
                    input = [
                        'arg1',
                        null,
                        undefined,
                        false,
                        2,
                        { a : 3 },
                        [4]
                    ];

                events.on('one', function () {
                    assert.lengthOf(
                        arguments,
                        0,
                        'Events emitted with no arguments should not pass arguments to their handlers'
                    );
                });

                events.on('two', deferred.callback(function () {
                    assert.deepEqual(
                        input,
                        Array.prototype.slice.call(arguments),
                        'Event handler must receive arguments exactly as they were emitted.'
                    );

                    events.off();
                }));

                events.emit('one');
                events.emit.apply(events, ['two'].concat(input));
            });

            test('.off() removes handlers for a specific event', function () {

                var deferred = this.async(1000),
                    wasHandlerOneRun = false,
                    wasHandlerTwoRun = false;

                function handler1() {
                    wasHandlerOneRun = true;
                }
                function handler2() {
                    wasHandlerTwoRun = true;
                }

                events.on('done', deferred.callback(function () {
                    assert.isTrue(
                        wasHandlerOneRun,
                        'When a handler is provided, others must be unaffected'
                    );
                    assert.isFalse(
                        wasHandlerTwoRun,
                        'When a handler is provided, it must not run anymore'
                    );
                }));

                events.on('something', handler1);
                events.on('something', handler2);
                events.on('something', handler2);
                events.on('something', handler1);
                events.off('something', handler2);
                events.emit('something');

                events.emit('done');
            });

            test('.off() removes all handlers when called with no arguments', function () {

                var deferred = this.async(1000),
                    wasCalled = false;

                events.on('one', function () {
                    wasCalled = true;
                });

                events.off();

                events.emit('one');

                events.on('two', deferred.callback(function () {
                    assert.isFalse(
                        wasCalled,
                        'A handler was run despite calling events.off with a wildcard'
                    );
                }));

                events.emit('two');
            });
        });
    }
);
