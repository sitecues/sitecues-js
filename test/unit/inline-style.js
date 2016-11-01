define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'mini-core/native-global',
        'run/inline-style/inline-style'
    ],
    function (
        tdd,
        assert,
        nativeGlobal,
        inlineStyle
    ) {
        'use strict';

        var suite  = tdd.suite;
        var test   = tdd.test;
        var before = tdd.before;
        var after  = tdd.after;

        suite('Inline Style', function () {
            before(function () {
                window.SC_EXTENSION = false;
                nativeGlobal.init();
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
                assert.strictEqual(element.style.display, overrideValue, 'The style value must be overridden');

                inlineStyle.restore(element, 'display');
                assert.strictEqual(element.style.display, intendedValue, 'The style value must be restored');
            });

            test('Override a style, change the intended style, restore the intended style', function () {
                var element = document.createElement('div');
                var overrideValue = '1';
                var intendedValue = '0';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style.zIndex, overrideValue, 'The style value must be overridden');

                intendedValue = '3';
                element.style.zIndex = intendedValue;
                inlineStyle.restore(element, 'zIndex');

                assert.strictEqual(element.style.zIndex, intendedValue, 'The style value must be restored');
            });

            test('Override a style override, and restore the last styles', function () {
                var element = document.createElement('div');
                var intendedValue = '0';
                var firstOverrideValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : firstOverrideValue
                });

                assert.strictEqual(element.style.zIndex, firstOverrideValue, 'The style value must be overridden');

                var secondOverrideValue = '2';
                inlineStyle.override(element, {
                    zIndex : secondOverrideValue
                });

                assert.strictEqual(element.style.zIndex, secondOverrideValue, 'The style value has\' been overridden a second time');

                inlineStyle.restoreLast(element, 'zIndex');

                assert.strictEqual(element.style.zIndex, firstOverrideValue, 'The previous style value must be restored');
            });

            test('Override a style value, clear all inline styles, restore the intended styles', function () {
                var element       = document.createElement('div');
                var intendedValue = '0';
                var overrideValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style.zIndex, overrideValue, 'The style value must be overridden');

                inlineStyle.clear(element);
                inlineStyle.restore(element);

                assert.strictEqual(element.style.zIndex, intendedValue, 'The intended style value must be restored');
            });

            test('Restoring a non-overridden style has no effect', function () {
                var element = document.createElement('div');
                var intendedValue = '0';

                element.style.zIndex = intendedValue;
                inlineStyle.restore(element);

                assert.strictEqual(element.style.zIndex, intendedValue, 'The intended style value must be preserved');
            });

            test('Override cssText and restore intended styles', function () {
                var element = document.createElement('div');
                var intendedValue = 'width: 100px; height: 100px; z-index: 99;';
                var overrideValue = 'left: 10px; min-width: 800px; opacity: 0.5; height: 90px;';

                element.style.cssText = intendedValue;
                inlineStyle.override(element, overrideValue);

                inlineStyle.restore(element, 'height');
                assert.strictEqual(element.style.height, '100px', 'The intended height must be restored');

                inlineStyle.restore(element, 'left');
                assert.strictEqual(element.style.left, '', 'The intended left value must be restored');

                inlineStyle.restore(element, 'minWidth');
                assert.strictEqual(element.style.minWidth, '', 'The intended min-width value must be restored');

                inlineStyle.restore(element, 'zIndex');
                assert.strictEqual(element.style.zIndex, '99', 'The intended z-index value must be restored');
            });

            test('Proxy an element\'s style field when a style value is overridden', function () {
                var element = document.createElement('div');
                var overrideValue = '0';
                var intendedValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, {
                    zIndex : overrideValue
                });

                assert.strictEqual(element.style, element._scStyleProxy, 'The style field must be proxied');
            });

            test('De-proxy an element\'s style field when it is completely restored', function () {
                var element = document.createElement('div');
                var elementStyle = element.style;
                var overrideValue = '0';
                var intendedValue = '1';

                element.style.zIndex = intendedValue;
                inlineStyle.override(element, ['zIndex', overrideValue]);

                assert.strictEqual(element.style, element._scStyleProxy, 'The style field must be proxied');

                inlineStyle.restore(element);

                assert.strictEqual(element.style, elementStyle, 'The element must be de-proxied');
                assert.isUndefined(element._scStyleProxy, 'The proxy field must be deleted');
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

                assert.strictEqual(element.style.getPropertyPriority('z-index'), '', 'The style must be overridden with important priority');

                inlineStyle.restore(element, 'z-index');

                assert.strictEqual(element.style.getPropertyPriority('z-index'), intendedPriority, 'The style must be restored with its original priority');
            });

            test('Override a style with importance, and restore it to its intended value', function () {
                var element          = document.createElement('div'),
                    property         = 'position',
                    overrideValue    = 'static',
                    overridePriority = 'important',
                    intendedValue    = 'absolute';
                element.style[property] = intendedValue;
                inlineStyle.override(element, [property, overrideValue, overridePriority]);
                assert.strictEqual(element.style[property], overrideValue, 'Style value must be overridden');
                assert.strictEqual(element.style.getPropertyPriority(property), overridePriority, 'Style must be overridden with important priority');
                inlineStyle.restore(element, property);
                assert.strictEqual(element.style[property], intendedValue, 'Style value must be restored to its intended value');
            });

            test('Override style A, override style B, restore A to intended value', function () {
                var element        = document.createElement('div'),
                    propertyA      = 'position',
                    overrideValueA = 'static',
                    overridePriorityA = 'important',
                    intendedValueA = 'absolute',
                    propertyB      = 'z-index',
                    overrideValueB = '99';
                element.style[propertyA] = intendedValueA;
                inlineStyle.override(element, [propertyA, overrideValueA, overridePriorityA]);
                inlineStyle.override(element, [propertyB, overrideValueB]);
                inlineStyle.restore(element, propertyA);
                assert.strictEqual(element.style[propertyA], intendedValueA, 'Style value must be restored to its intended value')
            });

            test('Override style A, override style A again, override style B, restore A to its intended value', function () {
                var element            = document.createElement('div'),
                    propertyA          = 'position',
                    overrideValueA1    = 'static',
                    overrideValueA2    = 'fixed',
                    overridePriorityA2 = 'important',
                    intendedValueA     = 'absolute',
                    propertyB          = 'z-index',
                    overrideValueB     = '99';

                element.style[propertyA] = intendedValueA;
                inlineStyle.override(element, [propertyA, overrideValueA1]);
                inlineStyle.override(element, [propertyA, overrideValueA2, overridePriorityA2]);
                inlineStyle.override(element, [propertyB, overrideValueB]);
                inlineStyle.restore(element, propertyA);
                assert.strictEqual(element.style[propertyA], intendedValueA, 'Style value must be restored to its last value')
            });

            test('Override style A, override style A again, override style B, restore A to last value', function () {
              var element         = document.createElement('div'),
                  propertyA       = 'position',
                  overrideValueA1 = 'static',
                  overrideValueA2 = 'fixed',
                  intendedValueA  = 'absolute',
                  propertyB       = 'z-index',
                  overrideValueB  = '99';

              element.style[propertyA] = intendedValueA;
              inlineStyle.override(element, [propertyA, overrideValueA1]);
              inlineStyle.override(element, [propertyA, overrideValueA2]);
              inlineStyle.override(element, [propertyB, overrideValueB]);
              inlineStyle.restoreLast(element, propertyA);
              assert.strictEqual(element.style[propertyA], overrideValueA1, 'Style value must be restored to its last value')
            });

            test('Override style A with importance, override style A again, override style B, restore A to last value and priority', function () {
                var element            = document.createElement('div'),
                    propertyA          = 'position',
                    overrideValueA1    = 'static',
                    overrideValueA2    = 'fixed',
                    overridePriorityA1 = 'important',
                    intendedValueA     = 'absolute',
                    propertyB          = 'z-index',
                    overrideValueB     = '99';

                element.style[propertyA] = intendedValueA;
                inlineStyle.override(element, [propertyA, overrideValueA1, overridePriorityA1]);
                inlineStyle.override(element, [propertyA, overrideValueA2]);
                inlineStyle.override(element, [propertyB, overrideValueB]);
                inlineStyle.restoreLast(element, propertyA);
                assert.strictEqual(element.style.getPropertyPriority(propertyA), overridePriorityA1, 'Style priority must be restored to its last value');
                assert.strictEqual(element.style[propertyA], overrideValueA1, 'Style value must be restored to its last value');
            });

            test('Override shorthand style, restore style', function () {
              var element       = document.createElement('div'),
                  property      = 'transition',
                  overrideValue = 'transform 0s',
                  intendedValue = '';
              inlineStyle.override(element, [property, overrideValue]);
              // Note in Edge, assigning 'transform 0s' to `transition` is changed to 'transform'
              // In Firefox, assigning 'transform 0s' to `transition` is changed to 'transform 0s ease 0s'
              inlineStyle.restore(element, property);
              assert.strictEqual(element.style.transition, intendedValue, 'Style value must match its intended value');
              assert.strictEqual(element.style.cssText, '', 'Element\'s css text must be empty');
            });

          after(function () {
              delete window.SC_EXTENSION;
          });
        });
    }
);
