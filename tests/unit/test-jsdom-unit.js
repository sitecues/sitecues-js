require('./test/bootstrap');
var page, fs = require('fs');

// #1
describe('test', function() {
    describe('#loadMarkup()', function() {
        before(function() {
            function tweakIt(html_in, callback) {
                var jsdom = require('jsdom');
                jsdom.env({
                    html: html_in,
                    scripts: [],
                    done: function(errors, window) {
                        callback(jquery(window.document).find('div')[0].innerHTML);
                    }
                });
            }

            var oldhtml = fs.readFileSync('./data/html/test-page.html');
            var newhtml = tweakIt(oldhtml, function(newstuff) {
              console.log(newstuff); // woohoo! it works!
            });
        });
        it('should load markup.', function(done) {
            done();
        });
    });
});

// #2
fs.readFile('./data/html/test-page.html', 'utf8', function(err, file) {
    page = file;

    describe('test', function() {
        describe('#loadMarkup() - 2', function() {
            it('should load markup.', function(done) {
                console.log(jquery(page).find('div')[0].innerHTML);
                done();
            });
        });
    });
});