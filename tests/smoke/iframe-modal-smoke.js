/**
 * This file contains functional smoke tests for Help/Feedback boxes
 * which can be reachable via toolbar's dropdown.
 * @type type
 */
var
  chai   = require("chai"),
  expect = chai.expect,
  fs     = require("fs"),
  swdda  = require("../lib/sitecues_swdda")
  ;

var DEFAULT_WAIT_TIME = 1000;

var CSS_SELECTOR_LOGO = 'sitecues-logo';
var CSS_SELECTOR_TOOLBAR = 'sitecues-toolbar';
var CSS_SELECTOR_DROPDOWN = 'dropdown-menu';
var CSS_SELECTOR_HELP = 'sitecues_help_show';
var CSS_SELECTOR_FEEDBACK = 'sitecues_feedback_show';
var CSS_SELECTOR_CLOSE = 'sitecues-close-button';

var CURRENT_TEST_PAGE_URL = '/site/simple.html';
var HELP_URL = '//s3.amazonaws.com/js.help.sitecues.com/help-expandable.html';
var FEEDBACK_URL = '//www.surveymonkey.com/s/MRQLLBF';

var FRAME_HELP = "iframe[src='" + HELP_URL + "']";
var FRAME_FEEDBACK = "iframe[src='" + FEEDBACK_URL + "']";

describe("sitecues", function() {
  describe("navigator", function() {
    
//    TODO: find the way to run before each test.
//    beforeEach(function() {
//     swdda.describeForEachBrowser("simple", function(session) {
//        console.log('before every test');
//      });
//    });

    // AK: I am really sorry but we really need all this toolbar interaction code
    // - to finally get access to Help/Feedback. This is not my fault. Sorry.
    swdda.describeForEachBrowser("simple", function(session) {
      it("Should navigate to the simple test page", function(done) {
        session.browser.deleteAllCookies(function(err) {
          expect(err).to.not.be.an.instanceof(Error);
          session.browser.get(swdda.testUrl(CURRENT_TEST_PAGE_URL), function() {
            session.browser.eval('window.location.href', function(err, value) {
              setTimeout(done, DEFAULT_WAIT_TIME / 2);
            });
          });
        });
      });

      it("Send F8 key to body", function(done) {
        session.browser.elementByTagName('body', function(err, body) {
          session.browser.type(body, '\uE038'); // F8
          setTimeout(done, DEFAULT_WAIT_TIME / 2);
        });
      });

      it("Should see the toolbar on the page", function(done) {
        session.browser.elementByClassName(CSS_SELECTOR_TOOLBAR, function(error) {
          expect(error).to.be.null;
          done();
        });
      });
      

/******************* HELP PAGE *******************************/

      // Here we begin to test 'Help'
      it("Should open toolbar dropdown and show Help page", function(done) {
        takeScreen(session, 'toolbar');
        session.browser.elementById(CSS_SELECTOR_LOGO, function(error, logo) {
          expect(error).to.be.null;
          // Open dropdown.
          session.browser.clickElement(logo);
          session.browser.waitForElementByClassName(CSS_SELECTOR_DROPDOWN, DEFAULT_WAIT_TIME, function(error) {
            takeScreen(session, 'dropdown');
            expect(error).to.be.null;
            session.browser.elementById(CSS_SELECTOR_HELP, function(error, help) {
              expect(error).to.be.null;

              session.browser.clickElement(help);
              // Help HLB appeared.
              session.browser.waitForElementByCssSelector(FRAME_HELP, DEFAULT_WAIT_TIME, function(error) {
                takeScreen(session, 'help');
                expect(error).to.be.null;
                session.browser.elementByCssSelector(FRAME_HELP, function(error, help) {
                  // Check Help HLB is visible.
//                  session.browser.isVisible(help, function(error) {
//                    expect(error).to.be.null;
//                  });
                  help.getComputedCss('display' , function(error, value) {
                    takeScreen(session, 'display');
                    expect(value).to.equal('block');
                  });         
                });
                setTimeout(done, DEFAULT_WAIT_TIME);
              });
            })
          });
        });
      });

      it("Should scroll Help page content", function(done) {
        // Make sure Help HLB exists.
        session.browser.hasElementByCssSelector(FRAME_HELP, function(error, exists) {
          expect(error).to.be.null;
          expect(exists).to.be.true;
          
          session.browser.frame(HELP_URL, function(error) {
            session.browser.elementByCssSelector(FRAME_HELP, function(error, help) {
              // Trigger scroll event inside frame.
              session.browser.moveTo(help, 1, 1, function(error) {
                session.browser.type(help, '\uE034'); // pagedown
                // TODO: Check that heights has changed.
                done();
              });
              
            });
          });
        });
      });

      it("Should close Help page content", function(done) {
        // Make sure Help HLB exists.
        session.browser.hasElementByCssSelector(FRAME_HELP, function(error, exists) {
          expect(error).to.be.null;
          expect(exists).to.be.true;

          session.browser.elementByCssSelector(FRAME_HELP, function(error, help) {
            // Click close.
            session.browser.elementById(CSS_SELECTOR_CLOSE, function(error, close) {
              expect(error).to.be.null;
              session.browser.clickElement(close);

              setTimeout(function() {
                help.getComputedCss('display', function(error, value) {
                  expect(exists).to.be.true;
                  expect(value).to.equal('none');
                });
                
                done();
              }, DEFAULT_WAIT_TIME);
            });
          });
        });
      });

/******************* FEEDBACK PAGE *************************/

      // Here we begin to test 'Feedback'
      it("Should open toolbar dropdown and show Feedback page", function(done) {
        session.browser.elementById(CSS_SELECTOR_LOGO, function(error, logo) {
          expect(error).to.be.null;
          // Open dropdown.
          session.browser.clickElement(logo);
          session.browser.waitForElementByClassName(CSS_SELECTOR_DROPDOWN, DEFAULT_WAIT_TIME, function(error) {
            expect(error).to.be.null;
            session.browser.elementById(CSS_SELECTOR_FEEDBACK, function(error, feedback) {
              expect(error).to.be.null;

              session.browser.clickElement(feedback);
              // Feedback HLB appeared.
              session.browser.waitForElementByCssSelector(FRAME_FEEDBACK, DEFAULT_WAIT_TIME, function(error) {
                expect(error).to.be.null;
                session.browser.elementByCssSelector(FRAME_FEEDBACK, function(error, feedback) {
                  // Check Feedback HLB is visible.
//                  session.browser.isVisible(feedback, function(error) {
//                    expect(error).to.be.null;
//                  });
                  feedback.getComputedCss('display' , function(error, value) {
                    expect(value).to.equal('block');
                  });         
                });
                setTimeout(done, DEFAULT_WAIT_TIME);
              });
            })
          });
        });
      });

      it("Should scroll Feedback page content", function(done) {
        // Make sure Feedback HLB exists.
        session.browser.hasElementByCssSelector(FRAME_FEEDBACK, function(error, exists) {
          expect(error).to.be.null;
          expect(exists).to.be.true;
          
          session.browser.frame(HELP_URL, function(error) {
            session.browser.elementByCssSelector(FRAME_FEEDBACK, function(error, feedback) {
              // Trigger scroll event inside frame.
              session.browser.moveTo(feedback, 1, 1, function(error) {
                session.browser.type(feedback, '\uE034'); // pagedown
                // TODO: Check that heights has changed.
                done();
              });
            });
          });
        });
      });

      it("Should close Feedback page content", function(done) {
        // Make sure Feedback HLB exists.
        session.browser.hasElementByCssSelector(FRAME_FEEDBACK, function(error, exists) {
          expect(error).to.be.null;
          expect(exists).to.be.true;

          session.browser.elementByCssSelector(FRAME_FEEDBACK, function(error, feedback) {
            // Click close.
            session.browser.elementById(CSS_SELECTOR_CLOSE, function(error, close) {
              expect(error).to.be.null;
              session.browser.clickElement(close);

              setTimeout(function() {
                feedback.getComputedCss('display', function(error, value) {
                  expect(exists).to.be.true;
                  expect(value).to.equal('none');
                });
                done();
              }, DEFAULT_WAIT_TIME);
            });
          });
        });
      });

      /**
       * For testing purposes...
       * @param {object} session
       * @param {string} name
       * @returns {void}
       */
      function takeScreen(session, name) {
        session.browser.takeScreenshot(function(error, screenshot) {
          fs.writeFile("foo.txt", screenshot, function(error) {
            if (!error) {
              console.log("The file was saved!");
            }
            var data = new Buffer(screenshot, 'base64');
            fs.writeFile(name + ".png", data, function(error) {
              // done();
            });
          });
        });
      }
    });
  });
});

