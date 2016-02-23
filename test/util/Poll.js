define(
    [
        './Base',
        'intern/dojo/node!leadfoot/helpers/pollUntil'
    ],
    function (Base, pollUntil) {

        'use strict';

        class Poll extends Base {

            constructor(remote) {
                super(remote);
            }

            untilElementStabilizes(selector, wait, pollInterval, elementAttributes, styleAttributes, rectAttributes) {
                // If the tracked values haven't changed within this many polls
                // We'll return true
                var STABILITY_THRESHOLD = 5,

                    attributes = {
                        element : elementAttributes || [],
                        style   : styleAttributes   || [],
                        rect    : rectAttributes    || []
                    };

                return this.remote
                    .then(pollUntil(
                        function (selector, attributes, stabilityThreshold) {
                            let namespace  = window.sitecuesTestingNamespace = window.sitecuesTestingNamespace || {},
                                attributeValues = [],
                                element = document.querySelector(selector);

                            if (!element) {
                                return null;
                            }

                            if (Array.isArray(element)) {
                                if (element.length === 1) {
                                    element = element[0];
                                }
                                else {
                                    throw new Error('Selector must return a single element to be valid');
                                }
                            }

                            if (element.nodeType !== 1) {
                                throw new Error('Selector must return an element');
                            }

                            if (attributes.element.length) {
                                storeValues(element, attributes.element);
                            }

                            if (attributes.style.length) {
                                storeValues(getComputedStyle(element), attributes.style);
                            }

                            if (attributes.rect.length) {
                                storeValues(element.getBoundingClientRect(), attributes.rect);
                            }

                            function storeValues(obj, attrs) {
                                attributeValues = attributeValues.concat(attrs.map(function (attr) {
                                    return obj[attr];
                                }));
                            }

                            if (namespace.savedValues) {
                                if (attributeValues.every(function (attr, i) { return attr === namespace.savedValues[i] } )) {
                                    namespace.stability++;
                                }
                                else {
                                    namespace.stability = 0;
                                }
                                namespace.savedValues = attributeValues;
                                return (namespace.stability >= stabilityThreshold) ? true : null;
                            }
                            else {
                                namespace.savedValues = attributeValues;
                                namespace.stability   = 0;
                                return null;
                            }
                        },
                        [selector, attributes, STABILITY_THRESHOLD], wait, pollInterval)
                    )
                    .execute(
                        function () {
                            sitecuesTestingNamespace.savedValues = undefined;
                            sitecuesTestingNamespace.stability   = undefined;
                        }
                    );
            }
        }

        return Poll;
    }
);
