/**
 * This module mocks any function of any object, including jQuery -- for testing purposes.
 * 
 * Usage Pattern:
 *        // Mock the method.
 *        var stub = mock.extend(object).stub("methodName", "Expected Return Value");
 *        // Assert actual and expected values.
 *        expect(object.methodName()).is.equal("Expected Return Value");
 *        // Restore mock(real function might be required by the other tests).
 *        stub.restore();
 * 
 * See also http://www.kowitz.net/javascript-mocking-framework
 */

 /**
 * Replace initial behavior with the behavior we want to see.
 * @param {object} exports
 * @returns {object}
 */
    mock = function () {
        var _mock = {
            extend: function (obj) {
                obj.stub = function (name, newBehaviour) {
                    var original = obj[name];
                    obj[name] = function () {
                      // If it is a function then simply call it.
                      if (isFunction(newBehaviour)) {
                        return newBehaviour.apply(obj, arguments);
                      }
                      // If it is a string then use it as a returning value.
                      if (isString(newBehaviour)) {
                        var func = function() {return newBehaviour;};
                        return func.apply(obj);
                      }
                    };
                    var stubDelegate = obj[name];
                    stubDelegate.original = original;
                    stubDelegate.restore = function () {
                        ///<summary>Removes the test stub and restores the original behaviour</summary>
                        if (!!obj[name].original) {
                            obj[name] = obj[name].original;
                        }
                        return obj;
                    };
                    return stubDelegate;
                };
                return obj;
            }
        };
        return _mock;
    } ();

  /**
   * Check if arg given is a function.
   * @param {any} functionToCheck
   * @returns {boolean}
   */
    function isFunction(functionToCheck) {
      var getType = {};
      return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

  /**
   * Check if arg given is a string.
   * @param {any} stringToCheck
   * @returns {boolean}
   */
    function isString(stringToCheck) {
      var getType = {};
      return stringToCheck && getType.toString.call(stringToCheck) === '[object String]';
    }
