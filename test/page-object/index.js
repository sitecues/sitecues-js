// API for creating any page object.
define(
    [
        './Base',
        './Lens',
        './Picker'
    ],
    function (Base, Lens, Picker) {

        'use strict';

        var i, len, api = {};

        // TODO: As soon as rest parameters and the spread operator are turned
        //       on by default in Node.js, we should use them here to pass
        //       arbitrary arguments to the constructor.
        function getPageObjectCreator(constructor) {

            function createPageObject(remote) {
                return new constructor(remote);
            }

            return createPageObject;
        }

        i = 0;
        for (len = arguments.length; i < len; i += 1) {
            api['create' + arguments[i].name] = getPageObjectCreator(arguments[i]);
        }

        return api;
    }
);
