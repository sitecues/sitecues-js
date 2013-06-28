var
  chai   = require("chai"),
  expect = chai.expect,
  swdda  = require("swdda")
;

describe("sitecues", function () {
  describe("navigator", function () {
    swdda.describeForEachBrowser("simple", function (session) {
      it("should navigate to the simple test page", function (done) {
        session.browser.get(swdda.testUrl("/site/simple.html"), function() {
          session.browser.title(function(error, title) {
            expect(title).to.be.a("string");
            expect(title).is.equal("Young Frankenstein");
            done();
          })
        });
      });
      it("should see the badge on the page", function (done) {
        setTimeout(function () {
          session.browser.elementById("sitecues-badge", function(error, element) {
            expect(element).to.exist;
            done();
          });
        }, 2500);
      });
    });
  });
});
