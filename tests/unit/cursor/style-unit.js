/**
 * This file contain unit test(s) for cursor/style.js file.
 */

require('../test/bootstrap');

// Require the module file we want to test.
var stylePath = '../../../source/js/cursor/style';
var module = require(stylePath);

describe('cursor/style', function() {

   describe('#detectCursorType()', function() {

       it('should return correct cursor type value if it is not neutral one', function(done) {
          var node = document.createElement("p");
          var expectedType = 'text';
          jquery(node).css('cursor', expectedType);
          var actualType = module.style.detectCursorType(node);
          expect(actualType).to.be.equal(expectedType);
          done();
        });

       it('should return corrected(prepared) cursor type value if neutral is not good enough', function(done) {
          var node = document.createElement("p");
          var expectedType = 'text';
          jquery(node).css('cursor', 'auto');
          var actualType = module.style.detectCursorType(node);
          expect(actualType).to.be.equal(expectedType);
          done();
        });

       it('should return original value even if it is not good enough but we didn\'t prepare a better one', function(done) {
          var node = document.createElement("span");
          var expectedType = 'auto';
          jquery(node).css('cursor', 'auto');
          var actualType = module.style.detectCursorType(node);
          expect(actualType).to.be.equal(expectedType);
          done();
        });
  });

   after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(stylePath);
      delete require.cache[name];
   });

});

require('../test/discharge');