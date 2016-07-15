define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'page/util/common',
        'core/platform'
    ],
    function (tdd, assert, common, platform) {
        'use strict';
        var suite  = tdd.suite,
            test   = tdd.test,
            before = tdd.before;

        suite('Common', function () {
            before(function () {
                platform.init();
            });

            test('.isTransparentColor() cares about colors', function () {
                this.skip('This method is not currently exported.');

                assert.isFalse(
                  common.isTransparentColor('rgba(4,4,4,.5)'),
                  'Explicit lack of alpha transparency is considered opaque'
                );

                assert.isTrue(
                    common.isTransparentColor('transparent'),
                    'Explicit transparency is considered transparent'
                );
                assert.isTrue(
                    common.isTransparentColor('rgba(4,4,4,0)'),
                    'Alpha transparency is considered transparent'
                );
            });

            test('.isWhitespaceOrPunct() checks for emptiness, blank space, punctuation', function () {
                var textNode = document.createTextNode('.');

                assert.isTrue(
                    common.isWhitespaceOrPunct(textNode),
                    'A . is punctuation'
                );

                textNode.data = '';
                assert.isTrue(
                    common.isWhitespaceOrPunct(textNode),
                    'Empty are whitespace-only'
                );

                textNode.data = 'abc123';
                assert.isFalse(
                    common.isWhitespaceOrPunct(textNode),
                    'Alphanumeric characters are not whitespace/punctuation.'
                );

                textNode.data = 0;
                assert.isFalse(
                    common.isWhitespaceOrPunct(textNode),
                    'Numeric zero is not whitespace/punctuation'
                );

                textNode.data = ' й ';
                assert.isFalse(
                  common.isWhitespaceOrPunct(textNode),
                  'Cyrillic characters are not whitespace/punctuation'
                );

                textNode.data = 'الزيتون';
                assert.isFalse(
                  common.isWhitespaceOrPunct(textNode),
                  'Arabic characters are not whitespace/punctuation'
                );

                textNode.data = ' ⁘⇋␥⸪⁜ ';
                assert.isTrue(
                  common.isWhitespaceOrPunct(textNode),
                  'Unicode punctuation is punctuation'
                );
            });

            // An element is a visual region if it does not share a background
            // color with its parent element, it has a background image and it
            // is not a sprite, its z index is greater than its parent, and
            // it isn't media with a width and height greater than five.
            test('.isVisualRegion()', function () {
                var parentStyle = {},
                    style = {},
                    element = {};

                parentStyle.backgroundColor = 'red';
                parentStyle.zIndex = 0;
                style.backgroundColor = 'red';
                style.backgroundImage = 'none';
                style.zIndex = 0;
                style.borderRightWidth = 0;
                style.borderBottomWidth = 0;

                assert.isFalse(
                    common.isVisualRegion(element, style, parentStyle),
                    'Element is not a visual region'
                );

                style.backgroundColor = 'blue';
                assert.isTrue(
                    common.isVisualRegion(element, style, parentStyle),
                    'Element has its own background color, therefore it is a visual region'
                );

                style.zIndex = 1;
                assert.isTrue(
                    common.isVisualRegion(element, style, parentStyle),
                    'Element has an elevated z index, must return true'
                );
                style.zIndex = 0;

                style.borderRightWidth = 1;
                assert.isTrue(
                    common.isVisualRegion(element, style, parentStyle),
                    'Element has non-zero border width, must return true'
                );
            });

            test('.hasRaisedZIndex() checks if the child has a greater z index than its parent', function () {
                var parentStyle = {},
                    style = {};

                parentStyle.zIndex = 0;
                style.zIndex = -1;
                assert.isFalse(
                    common.hasRaisedZIndex(style, parentStyle),
                    'The parent element has a greater z index than its child'
                );

                parentStyle.zIndex = 2;
                style.zIndex = 3;
                assert.isTrue(
                    common.hasRaisedZIndex(style, parentStyle),
                    'The child element has a greater z index than its parent'
                );
            });

            test('.isSprite()', function () {
                var style = {};
                // Element is a sprite if its backgroundImage != none,
                // and backgroundRepeat is 'no-repeat'
                // or backgroundPosition is 0 for x or y coors
                style.backgroundImage = 'url(\"test.com/test.png\")';
                style.backgroundRepeat = 'no-repeat';
                style.backgroundPosition = '1px 1px';

                assert.isTrue(
                    common.isSprite(style),
                    'Non-repeating background image is a sprite'
                );

                style.backgroundRepeat = 'repeat';

                style.backgroundPosition = '1px 0px';
                assert.isTrue(
                    common.isSprite(style),
                   'Repeating X positioned background image is a sprite'
                );

                style.backgroundPosition = '0px 1px';
                assert.isTrue(
                    common.isSprite(style),
                    'Repeating Y positioned background image is a sprite'
                );
            });

            test('.hasOwnBackground()', function () {
                // TODO: remove style.backgroundImage != none check from isSprite check, redundant
                var element = {},
                    style = {},
                    parentStyle = {};

                style.backgroundImage = 'none';
                style.backgroundColor = 'red';
                parentStyle.backgroundColor = 'red';
                assert.isFalse(
                    common.hasOwnBackground(element, style, parentStyle),
                    'Empty background images and identical background colors must return false'
                );

                parentStyle.backgroundColor = 'blue';
                assert.isTrue(
                    common.hasOwnBackground(element, style, parentStyle),
                    'Element with its own background color has a background'
                );
            });

            test('.hasOwnBackgroundColor()', function () {
                var element = {},
                    style = {},
                    parentStyle = {};

                element.parentNode = document.documentElement;

                parentStyle.backgroundColor = 'red';
                style.backgroundColor = 'red';
                assert.isFalse(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Same background colors are recognized'
                );

                parentStyle.backgroundColor = 'rgba(0, 0, 0, 0)';
                style.backgroundColor = 'rgb(255, 255, 255)';
                assert.isFalse(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'White on a transparent document is not visibly different'
                );

                parentStyle.backgroundColor = 'blue';
                assert.isTrue(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'A different background color is recognized'
                );
            });

            test('.hasVisibleContent()', function () {
                 var p = document.createElement('p');
                 p.textContent = 'abc123';
                 assert.isTrue(
                    common.hasVisibleContent(p),
                    'Element with non-empty text node children has visible content'
                );

                var textArea = document.createElement('textarea');
                textArea.textContent = 'weee';
                textArea.style.display = 'none';
                document.body.appendChild(textArea);
                assert.isFalse(
                    common.hasVisibleContent(textArea),
                    'Element with display set to none has no visible content'
                );

                // Cleanup side effects from the test.
                textArea.remove();
            });

            test('.isEmptyBgImage()', function () {
                assert.isFalse(
                    common.isEmptyBgImage('url(\"test.com/test.png\")'),
                    'Non-empty src string must return false'
                );

                assert.isTrue(
                    common.isEmptyBgImage(''),
                    'Empty string must return true'
                );
            });

            test('.createSVGFragment() makes useful markup', function () {
                var // Testing weird markup, since it should be agnostic.
                    content   = '!,2.y+',
                    className = 'blah',
                    fragment  = common.createSVGFragment(content, className),
                    // Using .childNodes over .children because we specifically
                    // do not expect an immediate text node child.
                    svg = fragment.childNodes[0];

                assert.strictEqual(
                    fragment.nodeType,
                    Node.DOCUMENT_FRAGMENT_NODE,
                    'Must return an actual fragment node'
                );

                assert.strictEqual(
                    svg.nodeName,
                    'svg',
                    'The fragment must contain an SVG'
                );

                assert.strictEqual(
                    svg.namespaceURI,
                    'http://www.w3.org/2000/svg',
                    'The fragment\'s SVG must be namespaced as an SVG'
                );

                assert.strictEqual(
                    svg.getAttribute('class'),
                    className,
                    'The fragment\'s SVG must have the requested class name'
                );

                assert.strictEqual(
                    svg.innerHTML,
                    content,
                    'The fragment\'s SVG must have the requested inner markup'
                );
            });

            test('.elementFromPoint()', function () {
                // potential alternative names considered
                // nearestElement, nearestElementInViewport, safeElementFromPoint, elementFromOnscreenPoint
                assert.strictEqual(
                    common.elementFromPoint(-1, -1),
                    document.elementFromPoint(0, 0),
                    'Must return element within viewport closest to point'
                );

                assert.strictEqual(
                    common.elementFromPoint(1, 1),
                    document.elementFromPoint(1, 1),
                    'Must return element from point within viewport'
                );
            });

            test('.hasVertScroll()', function () {
                assert.isFalse(
                    common.hasVertScroll(document.documentElement),
                    'Document element has no vertical scroll'
                );

                var textArea = document.createElement('textarea');
                textArea.appendChild(document.createTextNode('test1'));
                textArea.appendChild(document.createTextNode('\n\n\n\n\n\n\n\n\n\n'));
                textArea.appendChild(document.createTextNode('test2'));
                document.body.appendChild(textArea);

                assert.isTrue(
                    common.hasVertScroll(textArea),
                    'Element has a scroll height greater than its height'
                );

                // Cleanup side effects from the test.
                textArea.remove();
            });

            test('.getBulletWidth()', function () {
                // Only checks for decimal, could check for decimal-leading-zero, lower latin, initial (decimal), etc.
                // getClientWidth returns an integer value, getBoundingClientRect properties are not truncated
                var ul = document.createElement('ul');
                ul.style.fontSize = '12px';
                ul.appendChild(document.createElement('li'));
                document.body.appendChild(ul);
                assert.strictEqual(
                    common.getBulletWidth(ul, getComputedStyle(ul)),
                    common.getEmsToPx(ul.style.fontSize, 1.6)
                );
                var ol = document.createElement('ol');
                ol.setAttribute('start', '10');
                ol.appendChild(document.createElement('li'));
                document.body.appendChild(ol);
                assert.strictEqual(
                    common.getBulletWidth(ol, getComputedStyle(ol)),
                    common.getEmsToPx(ol.style.fontSize, 1.9)
                );

                // Cleanup side effects from the test.
                ul.remove();
                ol.remove();
            });

            test('.getComputedScale()', function () {

                var div = document.createElement('div');
                // NOTE: If an asymmetrical scale has been applied, only returns x scaling factor
                div.style.transform = 'scale(5,5)';
                document.body.appendChild(div);

                assert.strictEqual(
                    common.getComputedScale(div),
                    5,
                    'Must return inline scale if it is the only applied style'
                );

                div.style.transform += 'scale(5,5)';
                assert.strictEqual(
                    common.getComputedScale(div),
                    25,
                    'Must return the multiplied inline scale'
                );

                // Cleanup side effects from the test.
                div.remove();
            });
        });
    }
);
