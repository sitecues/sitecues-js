var
  chai   = require("chai"),
  expect = chai.expect,
  swdda  = require("../lib/sitecues_swdda")
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
        session.browser.waitForElementById("sitecues-badge", 3000, function(error) {
          expect(error).to.be.null;
          done();
        });
      });
    });
  });
});