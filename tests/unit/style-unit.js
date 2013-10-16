/**
 * This file contain unit test(s) for style.js file.
 */

require('./test/bootstrap');

getComputedStyle = null;

// Require the module file we want to test.
var module = require("../../source/js/style");

describe('style', function() {
      describe('#getComputed()', function() {
       it('should evaluate to empty with empty DOM object', function(done) {
          var res = module.style.getComputed(document.getElementById('sitecues'));
          expect(res).to.be.ok;
          expect(res).to.be.an('object');
          expect(res).to.eql({});
          done();
        });

    });
});

require('./test/discharge');