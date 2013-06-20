var
  swdda	  = require("swdda"),
  chai	  = require("chai"),
  expect  = chai.expect
  ;

describe("sitecues", function () {

  describe("navigator", function () {

    swdda.describeForEachBrowser('simple', function(s) {

      it("should navigate to the simple test page", function (done) {
        s.browser.get(swdda.testUrl('/site/simple.html'), function() {
          s.browser.title(function(err, title) {
            expect(title).to.be.a("string");
            expect(title).is.equal("Young Frankenstein");
            done();
          })
        });
      });

      it("should see the badge on the page", function (done) {
        setTimeout(function () {
          s.browser.elementById('sitecues-badge', function(err, el) {
            expect(el).to.exist;
            done();
          });
        }, 500);
      });

    });
  });
});
