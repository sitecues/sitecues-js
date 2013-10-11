/**
 * This file contain unit test(s) for cursor.js file.
 */

require('../test/bootstrap');

// Require the module file we want to test.
var module = require("../../../source/js/cursor");

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

      var zl, kDefaultZoomLevel;
      before(function() {
          zl = 1;
          kDefaultZoomLevel = 1;
      });

       it('should return initial values for auto cursor type with minimum zoom level.', function(done) {
          module.cursor.type = 'auto';
          var res = module.cursor.getCursorHotspotOffset(zl);
          expect(res).to.be.equal('0 5', 'Incorrect value found for cursor type ' + module.cursor.type + ' and zoom level ' + zl);
          done();
        });

       it('should return initial values for default cursor type with minimum zoom level.', function(done) {
          module.cursor.type = 'default';
          var res = module.cursor.getCursorHotspotOffset(zl);
          expect(res).to.be.equal('0 5', 'Incorrect value found for cursor type ' + module.cursor.type + ' and zoom level ' + zl);
          done();
        });

       it('should return initial values for pointer cursor type with minimum zoom level.', function(done) {
          module.cursor.type = 'pointer';
          var res = module.cursor.getCursorHotspotOffset(zl);
          expect(res).to.be.equal('10 5', 'Incorrect value found for cursor type ' + module.cursor.type + ' and zoom level ' + zl);
          done();
        });

       it('should fallback to default cursor type and values if cursor type is unknown.', function(done) {
          module.cursor.type = 'test'; // any string which is cannot be used a cursor type.
          var res = module.cursor.getCursorHotspotOffset(zl);
          expect(res).to.be.equal('0 5', 'Incorrect value found for unknown cursor type and zoom level ' + zl);
          done();
        });

        after(function() {
           // Do cleanup.
            zl = null;
            kDefaultZoomLevel = null;
        });

    });

    /**
     * This is an example of spying jquery style method.
     * See more info of how we create spy for it in boostrap.js
     */
    describe('#restoreCursorDisplay()', function() {

       it('should reset cursor style if custom cursor feature is enabled', function(done) {
          var target = document.getElementById('sitecues');
          jquery(target).css('cursor', 'auto');
          module.cursor.isEnabled = true;

          module.cursor.restoreCursorDisplay(target);
          expect(jquery.fn.style.calledOnce).to.be.true;
          expect(jquery(target).css('cursor')).to.be.equal('');
          done();
        });

    });

  /**
   * This is an example of overriding private method(getCursorHotspotOffset).
   * setFun() should declared in module itself.
   */
    describe('#changeCursorDisplay()', function() {

       it('should reset cursor type value if cursor feature is enabled', function(done) {
          var target = document.getElementById('sitecues');
          module.cursor.prevTarget = {};
          module.cursor.isEnabled = true;

          module.cursor.setFun('getCursorHotspotOffset', function() {return '0 5';});

          module.cursor.changeCursorDisplay(target);
          expect(jquery(target).css('cursor')).to.be.equal('url("testUrl") 0 5, default');
          done();
        });

   });
    
});
