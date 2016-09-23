define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'core/native-functions',
        'core/inline-style/inline-style'
    ],
    function (
        tdd,
        assert,
        nativeFn,
        inlineStyle
    ) {
        'use strict';

        var suite = tdd.suite;
        var test = tdd.test;
        var before = tdd.before;
        var beforeEach = tdd.beforeEach;

        suite('Inline Style', function () {
            before(function () {
                nativeFn.init();
                inlineStyle.init();
            });

            test('Override and restore a style value', function () {
                var element = document.createElement('div');
                var overrideValue = 'block';
                var intendedValue = 'none';

                element.style.display = intendedValue;
                inlineStyle.override(element, {
                    display : overrideValue
                });
                assert.strictEqual(element.style.display, overrideValue, 'The style value hasn\'t been overridden');

                inlineStyle.restore(element, 'display');
                assert.strictEqual(element.style.display, intendedValue, 'The style value hasn\'t been restored');
            });

            test('Override a style, change the intended style, restore the intended style', function () {
                var element = document.createElement('div');
                var overrideValue = '1';
                var intendedValue = '0';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style.zIndex, overrideValue, 'The style value hasn\'t been overridden');

                intendedValue = '3';
                element.style.zIndex = intendedValue;
                inlineStyle.restore(element, 'zIndex');

                assert.strictEqual(element.style.zIndex, intendedValue, 'The style value hasn\'t been restored');
            });

            test('Override a style override, and restore the last styles', function () {
                var element = document.createElement('div');
                var intendedValue = '0';
                var firstOverrideValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : firstOverrideValue
                });

                assert.strictEqual(element.style.zIndex, firstOverrideValue, 'The style value hasn\'t been overridden');

                var secondOverrideValue = '2';
                inlineStyle.override(element, {
                    zIndex : secondOverrideValue
                });

                assert.strictEqual(element.style.zIndex, secondOverrideValue, 'The style value has\' been overridden a second time');

                inlineStyle.restoreLast(element, 'zIndex');

                assert.strictEqual(element.style.zIndex, firstOverrideValue, 'The previous style value hasn\'t been restored');
            });

            test('Override a style value, clear all inline styles, restore the intended styles', function () {
                var element       = document.createElement('div');
                var intendedValue = '0';
                var overrideValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style.zIndex, overrideValue, 'The style value hasn\'t been overridden');

                inlineStyle.clear(element);
                inlineStyle.restore(element);

                assert.strictEqual(element.style.zIndex, intendedValue, 'The intended style value hasn\'t been restored');
            });

            test('Restoring a non-overridden style has no effect', function () {
                var element = document.createElement('div');
                var intendedValue = '0';

                element.style.zIndex = intendedValue;
                inlineStyle.restore(element);

                assert.strictEqual(element.style.zIndex, intendedValue, 'The intended style value hasn\'t been preserved');
            });

            test('Override cssText and restore intended styles', function () {
                var element = document.createElement('div');
                var intendedValue = 'height: 100px; width: 100px; z-index: 99;';
                var overrideValue = 'left: 10px; opacity: 0.5; min-width: 800px;';

                element.style.cssText = intendedValue;
                inlineStyle.override(element, overrideValue);

                assert.strictEqual(element.style.cssText, overrideValue, 'The cssText hasn\'t been overridden');

                inlineStyle.restore(element, 'height');
                assert.strictEqual(element.style.height, '100px', 'The intended height hasn\'t been restored');

                inlineStyle.restore(element, 'left');
                assert.strictEqual(element.style.left, '', 'The intended left value has\'t been restored');

                inlineStyle.restore(element);
                assert.strictEqual(element.style.cssText, intendedValue, 'The intended cssText hasn\'t been restored');
            });

            test('Proxy an element\'s style field when a style value is overridden', function () {
                var element = document.createElement('div');
                var overrideValue = '0';
                var intendedValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style, element._scStyleProxy, 'Element hasn\'t been proxied');
            });

            test('De-proxy an element\'s style field when it is completely restored', function () {
                var element = document.createElement('div');
                var elementStyle = element.style;
                var overrideValue = '0';
                var intendedValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, ['zIndex', overrideValue]);

                assert.strictEqual(element.style, element._scStyleProxy, 'The element hasn\'t been proxied');

                inlineStyle.restore(element);

                assert.strictEqual(element.style, elementStyle, 'The element hasn\'t been de-proxied');
                assert.isUndefined(element._scStyleProxy, 'The proxy field hasn\'t been deleted');
            });

            test('Restore an style value with its correct priority', function () {
                var element       = document.createElement('div');
                var overrideValue = '0';
                var intendedValue = '1';
                var intendedPriority = 'important';

                element.style.setProperty('z-index', intendedValue, intendedPriority);
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style.getPropertyPriority('z-index'), '', 'The style hasn\'t been overridden with the correct priority');

                inlineStyle.restore(element, 'z-index');

                assert.strictEqual(element.style.getPropertyPriority('z-index'), intendedPriority, 'The style hasn\'t been restored with the correct priority');
            });
        });
    }
);
