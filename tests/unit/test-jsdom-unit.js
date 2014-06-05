require('./test/bootstrap');
var page,
    fs = require('fs');

// #1
//fs.readFile('./data/html/test-page.html', 'utf8', function(err, file) {
//    var page = file;
//    jsdom.env(
//            page, [jquery],
//            function(err, window) {
//                if (err) {
//                    console.log(err);
//                }
//                var document = window.document;
//                console.log(window.document.documentElement.innerHTML);
//                console.log(document.documentElement.innerHTML);
//                //console.log(jquery(document.documentElement).innerHTML);
//                //console.log(jquery(page).find('p').length);
//                
//                // ---------- TESTS -----------
//                describe('test', function() {
//                    describe('#loadMarkup()', function() {
//                        it('should load markup.', function(done) {
//                            // Use window.document or document for testing...
//                            done();
//                        });
//                    });
//                });
//            });
//});

// #2
fs.readFile('./data/html/test-page.html', 'utf8', function(err, file) {
    page = file;

    describe('test', function() {
        describe('#loadMarkup()', function() {
            it('should load markup.', function(done) {
                console.log(jquery(page).innerHTML);
                done();
            });
        });
    });
});

