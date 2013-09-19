/**
 * This file contain unit test(s) for style.js file.
 */

require('./test/bootstrap');

// Require the module file we want to test.
var cursor = require("../../source/js/cursor");

describe('cursor', function() {
   describe('#init()', function() {

       it('should not initialize cursor if zoom level <= minimum zoom level.', function(done) {
          var zl = 1;
          cursor.isEnabled = false;
          var res = cursor.init(zl);
          expect(res).to.be.undefined;
          // todo: assert cursor.hide() called
          done();
        });

       it('should initialize cursor if zoom level > then minimum zoom level.', function(done) {
          var zl = 1.2;
          cursor.isEnabled = true;
          var res = cursor.init(zl);
          expect(res).to.be.undefined;
          // todo: assert cursor.show() called
          done();
        });

    });
});
