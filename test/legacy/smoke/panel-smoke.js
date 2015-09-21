var
  chai   = require("chai"),
  fs    = require("fs"),
  expect = chai.expect,
  swdda  = require("../lib/sitecues_swdda")
;

describe("sitecues", function () {
  describe("navigator", function () {
    swdda.describeForEachBrowser("simple", function (session) {
      it("should navigate to the simple test page", function (done) {
        session.browser.deleteAllCookies(function(err) {
          expect(err).to.not.be.an.instanceof(Error);
          session.browser.get(swdda.testUrl("/site/simple.html"), function() {
            session.browser.eval('window.location.href', function(err, value) {
              setTimeout(done, 5000);
            });
          });
        });
      });

      it("should see the badge on the page", function (done) {
        session.browser.waitForElementById("sitecues-badge", 1000, function(error) {
          expect(error).to.be.null;
          done();
        });
      });
   
     it("should move the mouse to the badge", function (done) {
        session.browser.elementById('sitecues-badge', function(err, badge) {
          session.browser.moveTo(badge, 1, 1, function(err) {
            session.browser.moveTo(badge, function(err) {
              setTimeout(done, 1000);
            });
          });
        });
      });

      it("should see the panel on the page", function (done) {
        session.browser.waitForElementById("sitecues-panel", 1000, function(error) {
          expect(error).to.be.null;
          done();
        });
      });

    });
	});
});
