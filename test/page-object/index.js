// API for creating any page object.
define(
    [
        './Base',
        './Lens',
        './Picker',
        './Badge',
        './Panel'
    ],
    function (Base, Lens, Picker, Badge, Panel) {

        'use strict';

        const len = arguments.length,
              api = {};

        function getPageObjectCreator(constructor) {

            function createPageObject() {
                return new constructor(...arguments);
            }

            return createPageObject;
        }

        for (let i = 0; i < len; i += 1) {
            api['create' + arguments[i].name] = getPageObjectCreator(arguments[i]);
        }

        return api;
    }
);
