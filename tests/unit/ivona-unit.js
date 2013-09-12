/**
 * This file contain unit test(s) for ivona.js file.
 */

require('./test/bootstrap');
var fs = require('fs'),
    page,
    ivona = require('../../source/js/speech/ivona.js'),
    $ = jquery;
fs.readFile('../pages/htmlentities.html', 'utf8', function (err, file) {
  page = file;
})
// Require the module file we want to test.

describe('ivona', function() {
  describe('#removeHTMLEntities()', function() {
    it('should remove any URI encoded html entities from a string', function(done) {
      $(page).find('p').each(function () {
        var oldText = encodeURIComponent($(this).text()),
            newText = ivona.removeHTMLEntities(oldText);
        expect(newText).to.not.equal(oldText);
      });
      done();
    });
  });
}); 