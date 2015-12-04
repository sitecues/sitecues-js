define(
    [
        './PageViewer',
        './UserInput',
        './Browser'
    ],
    function (PageViewer, UserInput, Browser) {

        'use strict';

        const len = arguments.length,
            api = {};

        // TODO: As soon as rest parameters and the spread operator are turned
        //       on by default in Node.js, we should use them here to pass
        //       arbitrary arguments to the constructor.
        function getUtilityObjectCreator(constructor) {

            function createUtilityObject() {
                return new constructor(...arguments);
            }

            return createUtilityObject;
        }

        for (let i = 0; i < len; i += 1) {
            api['create' + arguments[i].name] = getUtilityObjectCreator(arguments[i]);
        }

        return api;
    }
);
