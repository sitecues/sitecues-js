/**
 * This file contain unit test(s) for cursor/manager.js file.
 */

require('../test/bootstrap');
// Default value.
navigator = {'platform': ''};
require("../data/modules/cursor/images/win");
require("../data/modules/cursor/images/mac");
var module = {};

describe('cursor/images/manager', function() {

   describe('#use()', function() {

       it('should load Windows-like images if platform defined as Windows', function(done) {
         // Require the module file we want to test.
          navigator['platform'] = 'Win32';
          var module = require("../../../source/js/cursor/images/manager");
          expect(module.manager.urls).to.deep.equal(win.urls);

          done();
       });

      it('should load Mac-like images if platform defined as MacOs', function(done) {
          navigator['platform'] = 'MacPPC';
          var module = require("../../../source/js/cursor/images/manager");
          expect(module.manager.urls).to.deep.equal(mac.urls);
          done();
       });
       
       afterEach(function() {
          // Unload module from nodejs's cache
          var name = require.resolve('../../../source/js/cursor/images/manager');
          delete require.cache[name];
       })
  });
});