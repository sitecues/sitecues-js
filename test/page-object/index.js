// API for creating any page object.
define(
    [
        './Base',
        './Lens',
        './Picker',
        './Badge',
        './Panel'
    ],
    function (Base, Lens, Picker, Badge) {

        'use strict';

        const len = arguments.length,
              api = {};

        // TODO: As soon as rest parameters and the spread operator are turned
        //       on by default in Node.js, we should use them here to pass
        //       arbitrary arguments to the constructor.
        function getPageObjectCreator(constructor) {

            function createPageObject(remote) {
                return new constructor(remote);
            }

            return createPageObject;
        }

        for (let i = 0; i < len; i += 1) {
            api['create' + arguments[i].name] = getPageObjectCreator(arguments[i]);
        }

        return api;
    }
);
