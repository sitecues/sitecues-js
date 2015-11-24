// Wondering which commands you can run?
// See: http://theintern.github.io/leadfoot/Command.html

// Wondering which key constants there are?
// See: http://theintern.github.io/leadfoot/keys.js.html#line14

define(
  [
    'intern!tdd',                      // the testing interface - defines how we register suites and tests
    'intern/dojo/node!chai',              // helps throw errors to fail tests, based on conditions
    'intern/dojo/node!leadfoot/keys',  // unicode string constants used to control the keyboard
    'page-object'
  ],
  function (tdd, chai, keys, pageObject) {

    'use strict';

    const
      assert = chai.assert,
      suite  = tdd.suite,
      test   = tdd.test,
      before = tdd.before,
      beforeEach = tdd.beforeEach,
      URL    = 'http://tools.qa.sitecues.com:9000/site/simple.html' +
        '?scjsurl=//js.dev.sitecues.com/l/s;id=s-00000005/dev/latest/js/sitecues.js' +
        '&scwsid=s-00000005' +
        '&scuimode=badge';

    suite('Zoom controls', function () {
      // Code to run when the suite starts, before any test.
      before(function () {
        return this.remote               // represents the browser being tested
          .maximizeWindow()             // best effort to normalize window sizes (not every browser opens the same)
          // NOTE: Page load timeouts are not yet supported in SafariDriver.
          //       However, we are not testing Safari at the moment.
          .setPageLoadTimeout(2000)
          .setFindTimeout(2000)
          .setExecuteAsyncTimeout(5000);  // max ms for executeAsync calls to complete
      });

      beforeEach(function () {
        return this.remote
          .get(URL)
          .clearCookies()
          .execute(
            function () {
              localStorage.clear();
            }
          )
      });

      test('Plus key tapped to zoom up', function () {
        var oldRect;

        return this.remote
          .execute(
            function () {
              return document.body.children[0].getBoundingClientRect();
            }
          )
          .then(
            function (rect) {
              oldRect = rect;
            }
          )
          .execute(function () {
            var evt = new KeyboardEvent('keydown', {key : '=', keyCode : 187});
            document.documentElement.dispatchEvent(evt);
          })
          .execute(
            function () {
              return document.body.children[0].getBoundingClientRect();
            }
          )
          .then(
            function (newRect) {
              console.log('old width: '+JSON.stringify(oldRect));
              assert.isAtMost(
                newRect.width,
                oldRect.width * 3,
                'Zoomed element width should not be more than 3 times the original width'
              );
              assert.isAtMost(
                newRect.height,
                oldRect.height * 3,
                'Zoomed element width should not be more than 3 times the original length'
              );
            }
          )
      });

      test('Click on big A to zoom up', function () {
        const remote = this.remote,
          badge = pageObject.createBadge(remote),
          panel = pageObject.createPanel(remote);

        return remote
          .execute(function () {

          })
          .then(
            function () {
              return panel.clickBigARepeatedly();
            }
          )
      });

    });
  }
);
