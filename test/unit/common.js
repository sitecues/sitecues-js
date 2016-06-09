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
                assert.isTrue(
                    common.isTransparentColor('transparent'),
                    'Explicit transparency is considered transparent'
                );

                assert.isTrue(
                    common.isTransparentColor('rgba(4,4,4,0)'),
                    'Alpha transparency is considered transparent'
                );

                assert.isFalse(
                  common.isTransparentColor('rgba(4,4,4,.5)'),
                  'Explicit lack of alpha transparency is considered opaque'
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

            test('.hasRaisedZIndex() checks if the child has a greater z index than its parent', function () {
                var childStyle = {},
                    parentStyle = {};
                childStyle.zIndex = 3;
                parentStyle.zIndex = 2;

                assert.isTrue(
                    common.hasRaisedZIndex(childStyle, parentStyle),
                    'The child element has a greater z index than its parent'
                );

                childStyle.zIndex = -1;
                parentStyle.zIndex = 0;
                assert.isFalse(
                    common.hasRaisedZIndex(childStyle, parentStyle),
                    'The parent element has a greater z index than its child'
                );
            });

            test('.isWhitespaceOrPunct() checks if a text node is empty / has blank space / punctuation characters', function () {
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

            test('.isVisualRegion()', function () {
                var element = {},
                    style = {},
                    parentStyle = {};

                // An element is a visual region if it doesn't share a background color with its parent element,
                // it has a background image and it's not a sprite
                // it's z index is greater than its parent
                // and it isn't media with a width and height greater than five
                style.backgroundColor = 'red';
                parentStyle.backgroundColor = 'red';
                style.backgroundImage = 'none';
                style.zIndex = 0;
                style.borderRightWidth = 0;
                style.borderBottomWidth = 0;
                parentStyle.zIndex = 0;

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
                    'Element has an elevated z index, should return true'
                );
                style.zIndex = 0;

                style.borderRightWidth = 1;
                assert.isTrue(
                    common.isVisualRegion(element, style, parentStyle),
                    'Element has non-zero border width, should return true'
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
                    'Element is a sprite, non-repeating background img'
                );

                style.backgroundRepeat = 'repeat';
                style.backgroundPosition = '1px 0px';
                assert.isTrue(
                    common.isSprite(style),
                   'Background position y coordinate is equal to zero,' +
                   'should evaluate to true'
                );

                style.backgroundPosition = '0px 1px';
                assert.isTrue(
                common.isSprite(style),
                    'Background position x coordinate is equal to zero,' +
                    'should evaluate to true'
                );
                style.backgroundRepeat = 'no-repeat';
                style.backgroundPosition = '1px 1px';
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
                    'Empty background images and identical background colors should return false'
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

                style.backgroundColor = 'red';
                parentStyle.backgroundColor = 'red';
                assert.isFalse(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Parent and child share background color'
                );

                parentStyle.backgroundColor = 'blue';
                assert.isTrue(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Parent and child have different background colors'
                );

                parentStyle.backgroundColor = 'rgba(0, 0, 0, 0)';
                style.backgroundColor = 'rgb(255, 255, 255)';
                assert.isFalse(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Document element (parent) style\'s background color is transparent,' +
                    'child element\'s bg color is white, should return false'
                );
            });

            test('.hasVisibleContent()', function () {
                // Checks for size of media content box
                // Checks if (max 10) text node children are empty
                var element = document.createElement('textarea'),
                    text = document.createTextNode('\n\n\n\n\n\n\n\n\n');
                element.appendChild(text);
                document.body.appendChild(element);
                element.style.display = 'none';
                assert.isFalse(
                    common.hasVisibleContent(element),
                    'Element with display set to none has no visible content'
                );

                 element = document.createElement('p1');
                 text = document.createTextNode('abc123');
                 element.appendChild(text);
                 assert.isTrue(
                    common.hasVisibleContent(element),
                    'Element with non-empty text node children has visible content'
                );
            });

            test('.isEmptyBgImage()', function () {
                var imgSrc = 'url(\"test.com/test.png\")';

                assert.isFalse(
                    common.isEmptyBgImage(imgSrc),
                    'Non-empty src string should return false'
                );

                assert.isTrue(
                    common.isEmptyBgImage(''),
                    'Empty string should return true'
                );
            });

            test('.elementFromPoint()', function () {
                // potential alternative names considered
                // nearestElement, nearestElementInViewport, safeElementFromPoint, elementFromOnscreenPoint
                assert.strictEqual(
                    common.elementFromPoint(-1, -1),
                    document.elementFromPoint(0, 0),
                    'Should return element within viewport closest to point'
                );

                assert.strictEqual(
                    common.elementFromPoint(1,1),
                    document.elementFromPoint(1,1),
                    'Should return element from point within viewport'
                );
            });

            test('.hasVertScroll()', function () {
                var textArea = document.createElement('textarea');

                assert.isFalse(
                    common.hasVertScroll(document.documentElement),
                    'Document element has no vertical scroll'
                );

                textArea.appendChild(document.createTextNode('test1'));
                textArea.appendChild(document.createTextNode('\n\n\n\n\n\n\n\n\n\n'));
                textArea.appendChild(document.createTextNode('test2'));

                document.body.appendChild(textArea);
                assert.isTrue(
                    common.hasVertScroll(textArea),
                    'Element has a scroll height greater than its height'
                );
                // Cleanup side effects from the test.
                document.body.removeChild(textArea);
            });

            test('.getBulletWidth()', function () {
                // Only checks for decimal, could check for decimal-leading-zero, lower latin, initial (decimal), etc.
                // getClientWidth returns an integer value, getBoundingClientRect properties are not truncated
                var list = document.createElement('ul');
                document.body.appendChild(list);
                list.appendChild(document.createElement('li'));
                list.style.fontSize = '12px';
                assert.strictEqual(
                    common.getBulletWidth(list, getComputedStyle(list)),
                    common.getEmsToPx(list.style.fontSize, 1.6)
                );
                list = document.createElement('ol');
                list.appendChild(document.createElement('li'));
                list.setAttribute('start', '10');
                document.body.appendChild(list);
                assert.strictEqual(
                    common.getBulletWidth(list, getComputedStyle(list)),
                    common.getEmsToPx(list.style.fontSize, 1.9)
                );
            });

            test('.getComputedScale()', function () {
                var div = document.createElement('div');
                document.body.appendChild(div);
                div.style.transform = 'scale(5,5) ';
                assert.strictEqual(
                    common.getComputedScale(div),
                    5,
                    'Should return inline scale if it is the only applied style'
                );
                div.style[platform.transformProperty] += 'scale(5,5) ';
                assert.strictEqual(
                    common.getComputedScale(div),
                    25,
                    'Should return the multiplied inline scale'
                );
                // If an asymmetrical scale has been applied, only returns x scaling factor
            });
        });
    }
);
