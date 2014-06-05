/**
 * This file contain unit test(s) for traits.js file: getTraitStack()
 */

//require('./test/bootstrap');

var traitsPath = '../../source/js/mouse-highlight/traits';
require(traitsPath);

console.log('------------------------');
// If we want to use the file system
// var fs = require('fs');

var $ = jquery;

console.log($('html')[0].innerHTML);
console.log($(document.documentElement)[0].innerHTML);

//var document = jsdom.jsdom("<html><head></head><body><p id='dude'>hello world</p></body></html>");
//var window = document.parentWindow;
//console.log($('#dude').text())

//
//jsdom.env(
//  '<p><a class="the-link" href="https://github.com/tmpvar/jsdom">jsdom\'s Homepage</a></p>',
//  [],
//  function (errors, window) {
//    console.log("contents of a.the-link:", window.$("a.the-link").text());
//  }
//);

//jsdom.jsdom('<div class="testing">Hello World</div>');
//console.log($('.testing').text() + ' abc'); // outputs Hello World

//jsdom.env(
//  "http://nodejs.org/dist/",
//  ["http://code.jquery.com/jquery.js"],
//  function (errors, window) {
//    console.log("there have been", window.$("a").length, "nodejs releases!");
//  }
//);

//jsdom.env(
//  '<html></html>', [],
//  function (err, window) {
////  fs.readFile('./data/html/htmlentities.html', 'utf8', function (err, file) {
////    page = file;
////  });
//    $(window.document.documentElement).append('<body><div class="testing">Hello World</div></body>');
//    //console.log($(document.documentElement)[0] === $('html')[0]);
//    console.log(document.getElementsByClassName('testing'));
//    //console.log($('.testing').text() + 'zz'); // outputs Hello World
//
//    // ---------- TESTS -----------
//    describe('traitcache', function() {
//
//      describe('#fffff()', function() {
//        it('should have some nodes.', function(done) {
//          //var divElement = document.createElement('div');
//          var id = 3;
//          expect(typeof id).to.be.equal('number');
//          done();
//        });
//      });
//      after(function() {
//        // Unload module from nodejs's cache
//        var name = require.resolve(traitsPath);
//        delete require.cache[name];
//        console.log('------------------------');
//      });
//    });
//  });
//
//
//
