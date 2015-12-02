// API for creating any page object.
define(
    [
        './PageViewer',
        './UserInput'
    ],
    function (PageViewer, UserInput) {

        'use strict';

        const len = arguments.length,
            api = {};

        // TODO: As soon as rest parameters and the spread operator are turned
        //       on by default in Node.js, we should use them here to pass
        //       arbitrary arguments to the constructor.
        function getUtilityObjectCreator(constructor) {

            function createUtilityObject(remote) {
                return new constructor(remote);
            }

            return createUtilityObject;
        }

        for (let i = 0; i < len; i += 1) {
            api['create' + arguments[i].name] = getUtilityObjectCreator(arguments[i]);
        }

        return api;
    }
);
