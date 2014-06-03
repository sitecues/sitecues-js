/**
 * This file contain unit test(s) for ui-manager.js file: toggle, innerToggle
 */

require('./test/bootstrap');

// Require the module file we want to test.
var traitcachePath = '../../source/js/mouse-highlight/traitcache';
var module = require(traitcachePath);

describe('traitcache', function() {

   describe('#getOrCreateUniqueId()', function() {
       it('should trigger provide a number.', function(done) {
         var divElement = document.createElement('div');
         var id = module.getOrCreateUniqueId(divElement);
         expect(typeof id).to.be.equal("number");
         done();
        });
    });
    after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(traitcachePath);
      delete require.cache[name];
   });
});
