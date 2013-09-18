/**
 * This file contain unit test(s) for style.js file.
 */

require('./test/bootstrap');

// Require the module file we want to test.
var module = require("../../source/js/cursor");

describe('cursor', function() {

   describe('#init()', function() {
       it('should not initialize cursor if zoom level <= minimum zoom level.', function(done) {
          var zl = 1;
          sinon.spy(module.cursor, "hide");

          module.cursor.init(zl);
          expect(module.cursor.hide.calledOnce).to.be.true;
          module.cursor.hide.restore();
          done();
        });

       it('should initialize cursor if zoom level > then minimum zoom level.', function(done) {
          var zl = 1.2;
          sinon.spy(module.cursor, "show");
          
          module.cursor.init(zl);
          expect(module.cursor.show.calledOnce).to.be.true;
          module.cursor.show.restore();
          done();
        });
    });
    
    describe('#getCursorHotspot()', function() {

       it('should return initial values for default cursor type with minimum zoom level.', function(done) {
          var zl = 1;
          var kDefaultZoomLevel = 1;
          module.cursor.type = 'default';
          var res = module.cursor.getCursorHotspotOffset(zl);
          expect(res).to.be.equal('0 5');
          done();
        });

       it('should return initial values for pointer cursor type with minimum zoom level.', function(done) {
          var zl = 1;
          var kDefaultZoomLevel = 1;
          module.cursor.type = 'pointer';
          var res = module.cursor.getCursorHotspotOffset(zl);
          expect(res).to.be.equal('10 5', 'Set some informative message here.');
          done();
        });

    });
});
