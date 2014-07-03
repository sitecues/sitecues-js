/**
 * This file contains unit tests for core.js:sitecues.status().
 */

require('./test/libs');

var modPath    = '../../source/js/test-module';

var mod = {
  testMod    : require(modPath)
};

describe('sitecues', function() {
  describe('#test-module{}', function() {

    it('doSomethingCool should return 2 when passed (1,1)', function (done) {
      expect(mod.testMod.doSomethingCool(1,1)).to.equal(2);
      done();
    });
    

  });

  after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(modPath);
      delete require.cache[name];
      
      name = require.resolve(modPath);
      delete require.cache[name];
   });

});
