/**
 * This file contain unit test(s) for ivona.js file.
 *

require('./test/bootstrap');

var fs = require('fs'),
    page,
    // Require the module file we want to test.
    ivonaPath = '../../source/js/speech/ivona';
    ivona = require(ivonaPath),
    $ = jquery;

fs.readFile('./data/html/htmlentities.html', 'utf8', function (err, file) {
  page = file;
});

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
   after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(ivonaPath);
      delete require.cache[name];
   });
});

require('./test/discharge');
*/