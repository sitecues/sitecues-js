// 'use strict';

// // Imports.
// var
//   chai  = require('chai'),
//   swdda = require('swdda'),
//   wd    = require('wd')
// ;

// // Setup.
// var
//   expect  = chai.expect,
//   globals = {}
// ;

// describe('sitecues', function () {
//   describe('navigator', function () {
//     before(function (done) {
//       globals.identifier        = null;
//       globals.identifier_states = {
//         'BADGE': {
//           'id': 0,
//           'name': 'badge'
//         },
//         'TOOLBAR': {
//           'id': 1,
//           'name': 'toolbar'
//         }
//       };
//       globals.url               = swdda.testUrl('/site/simple.html');

//       done();
//     });
//     swdda.describeForEachBrowser('panel', function (session) {
//       it('should navigate to <sitecues_test_pages>/simple.html', function (done) {
//         session.browser.get(globals.url, function (error) {
//           expect(error).to.not.be.an.instanceof(Error);
//           session.browser.title(function (error, title) {
//             expect(error).to.not.be.an.instanceof(Error);
//             expect(title).is.equal('Young Frankenstein');
//             done();
//           });
//         });
//       });
//       it('should check which sitecues identifier (badge or toolbar) is on the page', function (done) {
//         session.browser.waitForVisibleByClassName(
//           'sitecues-toolbar-shim',
//           2500,
//           function (error) {
//             expect(error).to.not.be.an.instanceof(Error);
//             done();
//           }
//         );
//         Step(
//           function () {}
//         );
//       });
//     });
//   });
// });