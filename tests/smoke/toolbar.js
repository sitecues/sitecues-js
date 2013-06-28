"use strict";

// Imports.
var
  chai  = require("chai"),
  swdda = require("swdda"),
  wd    = require("wd")
;

// Setup.
var
  expect  = chai.expect,
  globals = {}
;

// describe("sitecues", function () {
//   describe("navigator", function () {
//     before(function (done) {
//       globals.url = swdda.testUrl("/site/simple.html");

//       done();
//     });

//     swdda.describeForEachBrowser("toolbar", function (session) {
//       it("should navigate to <sitecues_test_pages>/simple.html", function (done) {
//         session.browser.get(globals.url, function (error) {
//           expect(error).to.not.be.an.instanceof(Error);

//           session.browser.title(function (error, title) {
//             expect(error).to.not.be.an.instanceof(Error);
//             expect(title).is.equal("Young Frankenstein");

//             done();
//           });
//         });

//       });

//       it("should see toolbar on the page on F8", function (done) {
//         session.browser.keys(wd.SPECIAL_KEYS["F8"], function (error) {
//           expect(error).to.not.be.an.instanceof(Error);

//           session.browser.waitForElementByClassName(
//             "sitecues-toolbar",
//             500,
//             function (error) {
//               expect(error).to.not.be.an.instanceof(Error);

//               done();
//             }
//           );
//         });
//       });
//     });
//   });
// });
