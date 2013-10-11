/**
 * This file contain unit test(s) for ivona.js file.
 */

require('./test/bootstrap');
var fs = require('fs'),
    page,
    ivona = require('../../source/js/speech/ivona'),
    $ = jquery;
fs.readFile('./data/html/htmlentities.html', 'utf8', function (err, file) {
  page = file;
})
// Require the module file we want to test.

describe('ivona', function() {
  describe('#removeHTMLEntities()', function() {
    it('should remove any URI encoded html entities from a string', function(done) {
      $(page).find('p').each(function () {
        var actual = ivona.removeHTMLEntities(encodeURIComponent($(this).text())),
            expected = '__';
        expect(actual).to.be.equal(expected);
      });
      done();
    });
  });
}); 