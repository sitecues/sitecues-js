define(
    [
        'intern/dojo/node!leadfoot/helpers/pollUntil'
    ],
    function (pollUntil) {

        'use strict';

        function getRectAndSelectorOfVisibleElementInBody(remote) {
            return remote
                .execute(function () {
                    //20 body button:nth-child(19)  ***BROKEN
                    //19 #testId
                    //18 body div:nth-child(17)
                    //17 body span:nth-child(16)   ***BROKEN
                    //16 body a:nth-child(15)      ***BROKEN
                    var visibleNode, selector, currentElem, childIndex,
                        searching = true;

                    function walkTheDOM(node) {
                        var sibling, position,
                            element = node.element;
                            node.rect = element.getBoundingClientRect();

                        if (node.rect.height > 0 && node.rect.width > 0) {
                            visibleNode = node;
                            if (node.element.id) {
                                searching = false;
                            }
                        }
                        else {
                            node.rect = null;
                        }

                        position = node.treePosition;
                        sibling  = element.nextElementSibling;

                        while (sibling && searching) {
                            position = Object.create(position);
                            position[position.length - 1]++;
                            visitNode(sibling, position);
                            sibling = sibling.nextElementSibling;
                        }

                        if (element.firstElementChild && searching) {
                            position = Object.create(node.treePosition);
                            position.push(1);
                            visitNode(element.firstElementChild, position);
                        }

                        function visitNode(elem, pos) {
                            var newNode = {
                                element: elem,
                                treePosition: pos,
                                rect: null
                            };
                            walkTheDOM(newNode);
                        }

                    }

                    if (document.body.firstElementChild) {
                        walkTheDOM({
                            element: document.body.firstElementChild,
                            treePosition: [1],
                            rect: null
                        });
                    }
                    else {
                        return ['Body must have children elements to test zoom functionality'];
                    }

                    if (visibleNode) {
                        if (visibleNode.element.id) {
                            return [visibleNode.rect, '#' + visibleNode.element.id];
                        }
                        else {
                            currentElem = visibleNode.element;
                            childIndex = visibleNode.treePosition.shift();
                            selector = '';
                            while (childIndex !== undefined) {
                                selector = '>' + currentElem.tagName.toLowerCase()+':nth-child('+childIndex+')' + selector;
                                childIndex = visibleNode.treePosition.shift();
                                currentElem = currentElem.parentElement;
                            }
                            return [visibleNode.rect, 'body' + selector];

                        }
                    }
                    else {
                        return ['Body must have a visible child element to test zoom functionality'];
                    }

                });
        }

        function waitForElementToFinishAnimating(remote, selector, wait, pollInterval) {
            return remote
                .then(pollUntil(function (selector) {
                    var transitionRect,
                        element = document.querySelector(selector),
                        currentRect = element.getBoundingClientRect();
                    if (window.sitecuesTestingNamespace) {
                        transitionRect = window.sitecuesTestingNamespace.transRect;
                        window.sitecuesTestingNamespace.transRect = currentRect;
                        return (transitionRect.width === currentRect.width &&
                            transitionRect.height === currentRect.height) ? true : null;
                    }
                    else {
                        window.sitecuesTestingNamespace = { transRect : currentRect };
                        return null;
                    }
                }, [selector], wait, pollInterval))
                .execute(function () {
                    window.sitecuesTestingNamespace = undefined;
                })
        }

        return {
            waitForElementToFinishAnimating: waitForElementToFinishAnimating,
            getRectAndSelectorOfVisibleElementInBody: getRectAndSelectorOfVisibleElementInBody
        };
    }
);
