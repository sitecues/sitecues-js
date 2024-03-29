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

      it("body should not have invert filter", function (done) {
        session.browser.elementByTagName('body', function(err, el) {
          session.browser.getComputedCss(el, '-webkit-filter', function(err, value) {
            expect(err).to.not.be.an.instanceof(Error);
            expect(value).to.equal(null);
            done();
          });
        });
      });

      it("Send + key to body", function (done) {
        session.browser.elementByTagName('body', function(err, body) {
          session.browser.type(body, '+');
          setTimeout(done, 200);
        });
      });    

      it("Send r key to body", function (done) {
        session.browser.elementByTagName('body', function(err, body) {
          session.browser.type(body, 'r');
          setTimeout(done, 200);
        });
      });    

      // Commented this out. We switched the inverse key from 'r' to 'Cmd + LShift + R', We have
      // no method of testing special navkeys yet. - Al

      // it("body should have invert filter", function (done) {
      //   session.browser.elementByTagName('body', function(err, el) {
      //     session.browser.getComputedCss(el, '-webkit-filter', function(err, value) {
      //       expect(err).to.not.be.an.instanceof(Error);
      //       expect(value).to.equal('invert(1)');
      //       done();
      //     });
      //   });
      // });

      // it("Send r key to body", function (done) {
      //   session.browser.elementByTagName('body', function(err, body) {
      //     session.browser.type(body, 'r');
      //     setTimeout(done, 200);
      //   });
      // });    


      // it("body should not have invert filter", function (done) {
      //   session.browser.elementByTagName('body', function(err, el) {
      //     session.browser.getComputedCss(el, '-webkit-filter', function(err, value) {
      //       expect(err).to.not.be.an.instanceof(Error);
      //       expect(value).to.equal('none');
      //       done();
      //     });
      //   });
      // });

    });
	});
});
