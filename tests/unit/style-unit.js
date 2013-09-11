/**
 * This file contain unit test(s) for style.js file.
 */

require('./test/bootstrap');
getComputedStyle = null;

// Require the module file we want to test.
var style = require("../../source/js/style");

describe('sitecues', function() {
      describe('style', function() {
       it('getComputed should evaluate to empty with empty DOM object', function(done) {
          var res = style.getComputed(document.getElementById('sitecues'));
          expect(res).to.be.ok;
          expect(res).to.be.an('object');
          expect(res).to.eql({});
          done();
        });

    });
});
