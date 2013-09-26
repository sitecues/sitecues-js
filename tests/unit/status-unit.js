/**
 * This file contains unit tests for core.js:sitecues.status().
 */
        // , expected = 'Getting sitecues status.'

require('./test/libs');

navigator={ userAgent:true };


// Require the module file we want to test.
var module = require('../../source/js/status');
  
var sitecues = {
  tdd:true
};



describe('sitecues', function() {
  describe('status', function() {
    
    it('should return string', function (done) {
      var expected = 'Getting sitecues status.'
        , actual   = module.status.get()
        ;
      expect(actual).to.equal(expected);
      done();
    });

    it('should fire callback with status object', function (done) {
      function callback (data) {
        expect(data).to.be.an('object');
        done();
      }
      module.status.get(callback);
    });

  });
});
