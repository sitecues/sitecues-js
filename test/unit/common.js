define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'util/common'
    ],
    function (tdd, assert, common) {

        'use strict';

        var suite  = tdd.suite,
            test   = tdd.test;

        suite('common', function () {
            test('.equals() cares about sameness', function () {
                var obj1 = { a : 1, b : [ 2, 3 ] },
                    obj2 = { a : 1, b : [ 2, 3 ] };

                assert.isTrue(
                    common.equals(obj1, obj1),
                    'comparing an object with itself must return true'
                );

                assert.isTrue(
                    common.equals(obj1, obj2),
                    'comparing identical but separate objects must return true'
                );
            });
            test('.isTransparentColor() cares about colors', function () {
                this.skip('This method is not currently exported.');

                assert.isTrue(
                    common.isTransparentColor('transparent'),
                    'using explicit transparent value must return true'
                );

                assert.isTrue(
                    common.isTransparentColor('rgba(4,4,4,0)'),
                    'using alpha transparency must return true'
                );
            });
            test('.createSVGFragment() makes useful markup', function () {
                var // Testing weird markup, since it should be agnostic.
                    content   = ',,,!!!',
                    className = 'blah',
                    fragment  = common.createSVGFragment(content, className),
                    // Using .childNodes over .children because we specifically
                    // do not expect an immediate text node child.
                    svg       = fragment.childNodes[0];

                assert.strictEqual(
                    fragment.nodeType,
                    Node.DOCUMENT_FRAGMENT_NODE,
                    'must return an actual fragment node'
                );

                assert.strictEqual(
                    svg.nodeName,
                    'svg',
                    'the fragment must contain an SVG'
                );

                assert.strictEqual(
                    svg.namespaceURI,
                    'http://www.w3.org/2000/svg',
                    'the fragment\'s SVG must be namespaced as an SVG'
                );

                assert.strictEqual(
                    svg.getAttribute('class'),
                    className,
                    'the fragment\'s SVG must have the requested class name'
                );

                assert.strictEqual(
                    svg.innerHTML,
                    content,
                    'the fragment\'s SVG must have the requested inner markup'
                );
            });
        });
    }
);
