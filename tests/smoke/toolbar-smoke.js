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
              setTimeout(done, 500);
            });
          });
        });
      });

      it("Send F8 key to body", function (done) {
        session.browser.elementByTagName('body', function(err, body) {
          session.browser.type(body, '\uE038');
          setTimeout(done, 1000);
        });
      });    

      it("should see the toolbar on the page", function (done) {
        session.browser.elementByClassName("sitecues-toolbar", function(error) {
          expect(error).to.be.null;
          done();
        });
      });

    });
	});
});
