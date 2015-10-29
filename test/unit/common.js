define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'page/util/common',
        'core/platform'
    ],
    function (tdd, assert, common, platform) {

        'use strict';

        var suite = tdd.suite,
            test = tdd.test;

        suite('common', function () {
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
                    content = '!,2.y+',
                    className = 'blah',
                    fragment = common.createSVGFragment(content, className),
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
                var childStyle = document.createElement('style'),
                    parentStyle = document.createElement('style');
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
            test('.isEmpty() checks if a text node is empty / has blank space/punctuation characters', function () {
                var textNode = document.createTextNode('.')
                assert.isTrue(
                    common.isEmpty(textNode),
                    "Non empty strings with only punctuation return true."
                );

                textNode.data = "";

                assert.isTrue(
                    common.isEmpty(textNode),
                    "Empty strings return true."
                );

                textNode.data = "abc123";

                assert.isFalse(
                    common.isEmpty(textNode),
                    "Alphanumeric characters return false."
                );

                textNode.data = 0;

                assert.isFalse(
                    common.isEmpty(textNode),
                    "Zero is not empty"
                );

            });
            test('.isVisualRegion()', function () {
                var element = document.createElement('canvas'),
                    style = document.createElement('style'),
                    parentStyle = document.createElement('style');

                style.backgroundColor = 'red';
                parentStyle.backgroundColor = 'red';
                style.backgroundImage = 'none';
                parentStyle.zIndex = 0;
                style.zIndex = 0;
                style.borderRightWidth = 0;
                style.borderBottomWidth = 0;

                assert.isFalse(
                    common.isVisualRegion(element, style, parentStyle),
                    'Does not meet visual region specification'
                );

                /*
                 style.backgroundImage = null;
                 assert.isFalse(
                 common.isVisualRegion(element, style, parentStyle),
                 'Background image is null.'
                 );
                 style.backgroundImage = 'none';
                 */


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
                style.borderRightWidth = 0;


            });
            test('.isSprite()', function () {
                var element = document.createElement('div');
                var style = element.style;
                style.backgroundImage = 'initial';
                style.backgroundRepeat = 'no-repeat';


                assert.isTrue(
                    common.isSprite(style),
                    'Style meets sprite specification'
                );

                /*
                 style.backgroundRepeat = null;
                 style.backgroundPosition = '-50px 0px';
                 assert.isTrue(
                 common.isSprite(style),
                 'Background position y coordinate is equal to zero,' +
                 'should evaluate to true'
                 );
                 style.backgroundRepeat = 'no-repeat';
                 style.backgroundPosition = 'initial';
                 */

                /*
                 style.backgroundRepeat = null;
                 style.backgroundPosition = '0px -50px';
                 assert.isTrue(
                 common.isSprite(style),
                 'Background position x coordinate is equal to zero,' +
                 'should evaluate to true'
                 );
                 style.backgroundRepeat = 'no-repeat';
                 style.backgroundPosition = 'initial';
                 */

                /*
                 style.backgroundImage = null;
                 assert.isFalse(
                 common.isSprite(style),
                 'Background image is null, should evaluate to false.'
                 );
                 style.backgroundImage = 'none';
                 */

            });
            test('.hasOwnBackground()', function () {
                var element = document.createElement('div'),
                    style = element.style,
                    parentStyle = document.createElement('style');


                style.backgroundImage = null;
                style.backgroundRepeat = 'no-repeat';
                style.backgroundColor = 'red';
                document.body.appendChild(element);
                assert.isFalse(
                    common.hasOwnBackground(element, style, parentStyle),
                    'Null background images should return false'
                );






            });
            test('.hasOwnBackgroundColor()', function () {
                var element = document.createElement('div'),
                    style = document.createElement('style'),
                    parentStyle = document.createElement('style'),
                    parent = document.documentElement;

                style.backgroundColor = 'red';
                parentStyle.backgroundColor = 'red';
                assert.isFalse(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Parent and child share background color'
                );

                style.backgroundColor = 'red';
                parentStyle.backgroundColor = 'blue';
                assert.isTrue(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Parent and child have different background colors'
                );
                parentStyle.backgroundColor = 'red';

                /*
                 parentStyle.backgroundColor = 'hsla(120, 100%, 50%, 0.0)';
                 parent.appendChild(element);
                 assert.isFalse(
                 common.hasOwnBackgroundColor(element, style, parentStyle),
                 'Document element (parent) style\'s background color is transparent,' +
                 ' child element\'s bg color is not white, should return true'
                 );
                 parentStyle.backgroundColor = 'red';
                 parent.removeChild(element);
                 */

                parentStyle.backgroundColor = 'red';
                style.backgroundColor = 'transparent';
                parent.appendChild(element);
                assert.isFalse(
                    common.hasOwnBackgroundColor(element, style, parentStyle),
                    'Document element (parent) style\'s background color is transparent,' +
                    'child element\'s bg color is white, should return false'
                );
                parentStyle.backgroundColor = 'red';
                style.backgroundColor = 'red';
                parent.removeChild(element);


            });
            test('.hasVisibleContent()', function () {
                //Checks for size of media content box
                //Checks if (max 10?) text node children are empty
                var element = document.createElement("keygen");
                var element2;

                /* breaks isFormControl
                 assert.isTrue(
                 common.hasVisibleContent(element),
                 'Drop down keygen menu is visible content'
                 );
                 */

                /* breaks isEmpty
                 element = document.createElement('p1');
                 element2 = document.createTextNode('//////////////');
                 element.appendChild(element2);
                 assert.isTrue(
                 common.hasVisibleContent(element),
                 'Element with non-empty text node children has visible content'
                 );
                 */

                element = document.createElement('img');
                element.setAttribute('src', 'null');
                assert.isFalse(
                    common.hasVisibleContent(element),
                    'Image element with null source doesn\'t have visible content'
                );


            });
            test('.isEmptyBgImage()', function () {
                var imgSrc = "http://js.sitecues.com/f/s;id=s-17d1c25f/img/no-sitecues-support-warning.png";

                assert.isFalse(
                    common.isEmptyBgImage(imgSrc),
                    "Non-empty src string should return true"
                );

                assert.isTrue(
                    common.isEmptyBgImage(null),
                    "Null value should return true"
                );

                /**What should the method return if it is an invalid uri?
                 assert.isTrue(
                 common.isEmptyBgImage('0'),
                 "Non-uri value returns false"
                 );
                 */

            });
            test('.elementFromPoint()', function () {
                //element.innerWidth/height is unsupported in IE8 and before
                //nearestElement, nearestElementInViewport, safeElementFromPoint, elementFromOnscreenPoint
                //Coordinates outside of viewport are corrected
                assert.strictEqual(
                    common.elementFromPoint(-1, -1),
                    document.documentElement
                );

            });
            test('.hasVertScroll()', function () {
                var i,
                    textArea = document.createElement('textarea');

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
                document.body.removeChild(textArea);

            });
            test('.getBulletWidth()', function () {
                this.skip('Unwritten test.');
                //Only checks for decimal, could check for decimal-leading-zero, lower latin, initial (decimal), etc.

            });
            test('.getComputedScale()', function () {
                var div = document.createElement('div');
                document.body.appendChild(div);
                div.style[platform.transformProperty] += 'scale(6,5) ';
                div.style[platform.transformProperty] += 'rotate(10deg)';
                console.log(JSON.stringify(getComputedStyle(div)[platform.transformProperty]));
                //If an asymmetrical scale has been applied, only returns x scaling factor
            });
        });
    }
);
