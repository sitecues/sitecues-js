/**
 * This file contain unit test(s) for style.js file.
 * TODO: since lines 5-35 most probably will be repeated in each test file we create
 * I'd take this code out to a sharing file and then require it when necessary.
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
