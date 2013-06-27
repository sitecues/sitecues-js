var
  swdda   = require("swdda"),
  chai    = require("chai"),
  expect  = chai.expect
  ;

describe("sitecues", function () {

  describe("navigator", function () {

    swdda.describeForEachBrowser('panel-show on badge hover', function(s) {

      it("should navigate to the simple ebank page", function (done) {
        s.browser.get(swdda.testUrl('/site/ebank/index.html'), function() {
          s.browser.title(function(err, title) {
            expect(title).to.be.a("string");
            expect(title).is.equal("eBank of North America");
            done();
          })
        });
      });

      // it("should see the panel on the page when the badge is hovered", function (done) {
      //   s.browser.waitForVisibleById('sitecues-badge', 10000, function(err, el) {
      //     s.browser.elementById('sitecues-badge', function(err, el) {
      //       s.browser.moveTo(el, 0, 0, function(){
      //         s.browser.waitForVisibleById('sitecues-panel', 10000, function(err, el) {
      //           done();
      //         });
      //       });
      //     });
      //   });
      // });
      
    });
  });
});
