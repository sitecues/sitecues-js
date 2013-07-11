// 'use strict';

// // Module imports.
// var
//   // Module for assertions.
//   chai          = require('chai'),
//   // Module for stepping through asynchronous logic.
//   step          = require('step'),
//   // Module for awesomeness with sitecues WebDriver Deluxe Awesomeness!
//   swdda         = require('swdda'),
//   // Module for even more awesomeness with sitecues WebDriver Deluxe Awesomeness!!!
//   // swdda_helpers = require('./swdda_helpers'),
//   // Module for doing WebDriver work.
//   wd            = require('wd')
// ;

// // Setup.
// var
//   expect  = chai.expect,
//   globals = {
//     'url': null
//   }
// ;

// describe('sitecues', function () {
//   describe('navigator', function () {
//     before(function (done) {
//       globals.url = swdda.testUrl('/site/simple.html');

//       done();
//     });
//     swdda.describeForEachBrowser('toolbar', function (session) {
//       swdda_helpers.currentSession(session);
//       it('should navigate to <sitecues_test_pages>/simple.html', function (done) {
//         step(
//           function () {
//             var next = this;

//             session.browser.get(globals.url, function (error) {
//               next();
//             });
//           },
//           function () {
//             var next = this;

//             session.browser.title(function (error, title) {
//               expect(title).is.equal('Young Frankenstein');
//               next();
//             });
//           },
//           function () {
//             done();
//           }
//         );
//       });
//       it('should see the sitecues toolbar on the page', function (done) {
//         step(
//           function () {
//             var next = this;

//             session.browser.elementByTagName('body', next);
//           },
//           function (error, element) {
//             var next = this;

//             session.browser.type(
//               element,
//               wd.SPECIAL_KEYS['F8'],
//               next
//             );
//           },
//           function (error) {
//             var next = this;

//             swdda_helpers.isIdentifierBadgeOrToolbar(next);
//           },
//           function (error, identifier) {
//             var next = this;

//             switch (identifier) {
//               case 'badge':


//                 break;
//               case 'toolbar':
//                 next();

//                 break;
//               default:
//                 swdda_helpers.noop(); // For now...
//             }
//           }



//           function () {
//             var next = this;

//             session.browser.waitForElementByClassName(
//               'sitecues-toolbar',
//               3000,
//               next
//             );
//           },
//           function (error) {
//             done();
//           }
//         );
//       });
//     });
//   });
// });