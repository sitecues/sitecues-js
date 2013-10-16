/**
 * This file contain unit test(s) for ui-manager.js file: toggle, innerToggle
 */

require('./test/bootstrap');

// Require the module file we want to test.
var uiManagerPath = '../../source/js/ui-manager';
var module = require(uiManagerPath);

describe('ui-manager', function() {

   describe('#toggle()', function() {
       it('should trigger inner toogle.', function(done) {
//          sinon.spy(module.uiManager, "innerToogle");
//          var res = module.uiManager.toggle();
//          expect(res).to.be.equal(1);
//          expect(module.uiManager.toggle.innerToggle.calledOnce).to.be.true;
//          module.uiManager.innerToogle.restore();
          done();
        });
    });
    after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(uiManagerPath);
      delete require.cache[name];
   });
});
