var
  swdda   = require("swdda"),
  chai    = require("chai"),
  expect  = chai.expect
  ;

// var startID = (+ new Date());

var onError = function(e){
  this.or = function(callback) {
    callback();
  };

  if (err) {
    console.log( e.message );
  }else{
    return this;
    
  }
};



var log = function(e){
  if(typeof e == "object"){
   console.log(JSON.stringify(e))
  } else {
    console.log(e);
  }
  return;
};


describe("sitecues", function () {

  describe("navigator", function () {

    swdda.describeForEachBrowser('panel-show on badge hover', function(s) {

      it("should navigate to the simple ebank page", function (done) {
        log("loaded page");
        s.browser.get(swdda.testUrl('/site/eBank/index.html'), function() {
          s.browser.title(function(err, title) {
            expect(title).to.be.a("string");
            expect(title).is.equal("eBank of North America");
            done();
          })
        });
      });


      it("testing div#main", function (done) {
        s.browser.waitForVisibleById('main', 3000, function(err) {
          onError(err).or(function(){
            console.log("Aaaaaaa!");
          });
          done();
        });
      });

      // it("testing div#impossible", function (done) {
      //   s.browser.waitForVisibleById('impossible10861461304', 3000, function(err) {
      //     log(err instanceof Error);
      //     if(err==null){
      //       log("______________________________________");
      //       log("found:div#impossible");
      //     }else{
      //       log("impossible:ERROR!");
      //       //log(err.stack);
      //       log(err.message);
      //     }
      //     done();
      //   });
      // });

      // it("should see the badge on the page", function (done) {
      //   s.browser.waitForVisibleById('sitecues-badge', 3000, function(err) {
      //     log("see sitecues badge");
      //     log(err);
      //     log(arguments);
      //     done();
      //   });
      // });

      // var sitecuesBagdeElem;

      // it("return sitecues", function (done) {
      //   s.browser.elementById('sitecues-badge', function(err, el) {
      //     log("storred badge element to variable");
      //     sitecuesBagdeElem = el;
      //     done();
      //   });
      // });
      
      // it("move mouse to sitecues badge", function (done) {
      //   s.browser.moveTo(sitecuesBagdeElem, 0, 0, function(err){
      //     //log(sitecuesBagdeElem);
      //     log("hovered mouse to sitecues badge");
      //     done();
      //   });
      // });

      // it("should see the badge on the page", function (done) {
      //   s.browser.waitForVisibleById('sitecues-panel', 3000, function(err) {
      //     log("badge is visible");
      //     done();
      //   });
      // });
      
    });
  });
});
