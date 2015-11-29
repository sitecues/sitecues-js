define(
    [
        'intern/dojo/node!leadfoot/helpers/pollUntil',
        'intern/dojo/node!chai'
    ],
    function (pollUntil, chai) {

        'use strict';
        const assert = chai.assert;

        function getRectAndIdOfVisibleElementInBody(remote) {
            return remote
                .execute(function () {
                    var visibleRect, visibleNode,
                        defaultId = 'SITECUES_TEST_ID',
                        searching = true;

                    function walkTheDOM(node) {
                        var sibling,
                            rect = node.getBoundingClientRect();
                        if (rect.height > 0 && rect.width > 0) {
                            visibleRect = rect;
                            visibleNode = node;
                            if (visibleNode.id) {
                                searching = false;
                            }
                        }
                        sibling = node.nextElementSibling;
                        while (sibling && searching) {
                            walkTheDOM(sibling);
                            sibling = sibling.nextElementSibling;
                        }
                        if (node.firstElementChild && searching) {
                            walkTheDOM(node.firstElementChild);
                        }
                    }

                    walkTheDOM(document.body.firstElementChild);

                    if (visibleNode && visibleRect) {
                        if (visibleNode.id) {
                            return [visibleNode.getBoundingClientRect(), visibleNode.id];
                        }
                        else {
                            while (document.getElementById(defaultId)) {
                                defaultId += '_';
                            }
                            visibleNode.id = defaultId;
                            return [visibleRect, defaultId];
                        }
                    }
                    else {
                        throw new Error('There are no visible elements on the page, can\'t test zoom functionality');
                    }
                });
        }

        function waitForElementToFinishAnimating(remote, id, wait, pollInterval) {
            return remote
                .then(pollUntil(function (id) {
                    var transitionRect,
                        element = document.getElementById(id),
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
                }, [id], wait, pollInterval))
                .execute(function () {
                    window.sitecuesTestingNamespace = undefined;
                })
        }

        function compareOriginalAndZoomedDOMRects(remote, oldRect, zoomRect) {
            console.log('oldRect', oldRect);
            console.log('zoomRect', zoomRect);
            return remote
                .then(function () {
                    assert.isAtMost(
                        zoomRect.bottom,
                        oldRect.bottom * 3.1,
                        'Zoomed element\'s bounding rect\'s bottom property should be at most 3.1 times the original bottom value'
                    );
                    assert.isAtMost(
                        zoomRect.right,
                        oldRect.right * 3.1,
                        'Zoomed element\'s bounding rect\'s right property should be at most 3.1 times the original right value'
                    );
                    assert.isAtLeast(
                        zoomRect.bottom,
                        oldRect.bottom * 1.5,
                        'Zoomed element\'s bounding rect\'s bottom property should be at least 1.5 times the original bottom value'
                    );
                    assert.isAtLeast(
                        zoomRect.right,
                        oldRect.right * 1.5,
                        'Zoomed element\'s bounding rect\'s right property should be at least 1.5 times the original value'
                    );
                });
        }

        return {
            waitForElementToFinishAnimating: waitForElementToFinishAnimating,
            getRectAndIdOfVisibleElementInBody: getRectAndIdOfVisibleElementInBody,
            compareOriginalAndZoomedDOMRects: compareOriginalAndZoomedDOMRects
        };
    }
);
