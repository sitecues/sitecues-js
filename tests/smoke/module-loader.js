'use strict';

// Imports.
var
  chai  = require('chai'),
  fs    = require('fs'),
  swdda = require('swdda')
;

// Setup.
var
  expect  = chai.expect,
  globals = {}
;

describe('sitecues', function () {
  describe('navigator', function () {
    before(function (done) {
      globals.url = swdda.testUrl('/site/simple.html');

      done();
    });
    swdda.describeForEachBrowser('module loader', function (session) {
      it('should navigate to <sitecues_test_pages>/simple.html', function (done) {
        session.browser.get(globals.url, function (error) {
          expect(error).to.not.be.an.instanceof(Error);
          session.browser.title(function (error, title) {
            expect(error).to.not.be.an.instanceof(Error);
            expect(title).is.equal('Young Frankenstein');
            done();
          });
        });
      });
      it('should load modules', function (done) {
        var script = fs.readFileSync('scripts/stubs/load-modules.js.stub', {
          'encoding': 'utf8'
        });

        session.browser.execute(script, function (error, result) {
          setTimeout(function () {
            session.browser.eval('phantomjs_context.toString()', function (error, value) {
              expect(value).to.be.a('string');
              expect(value).to.equal('[object Object]');
              done();
            });
          }, 3500);
        });
      });
      it('should have loaded badge [sitecues] module', function (done) {
        session.browser.eval('phantomjs_context.badge', function (error, value) {
          expect(value).to.have.ownProperty('altBadges');
          expect(value).to.have.ownProperty('badgeId');
          expect(value.badgeId).to.equal('sitecues-badge');
          expect(value).to.have.ownProperty('disable');
          expect(value).to.have.ownProperty('element');
          expect(value).to.have.ownProperty('enable');
          expect(value).to.have.ownProperty('hide');
          expect(value).to.have.ownProperty('panel');
          expect(value).to.have.ownProperty('show');
          done();
        });
      });
      it('should have loaded jquery module', function (done) {
        session.browser.eval('phantomjs_context.jquery.fn.jquery', function (error, value) {
          expect(value).to.be.a('string');
          expect(value).to.equal('1.9.1');
          done();
        });
      });
      it('should have loaded keys [sitecues] module', function (done) {
        session.browser.eval('phantomjs_context.keys', function (error, value) {
          expect(value).to.have.ownProperty('test');
          expect(value).to.have.ownProperty('hlbKeysTest');
          expect(value).to.have.ownProperty('map');
          expect(value).to.have.ownProperty('hlbKeysMap');
          expect(value).to.have.ownProperty('handle');
          //expect(value).to.have.ownProperty('isEditable'); EQ-1066 Module no longer has this method.
          expect(value).to.have.ownProperty('hook');
          done();
        });
      });
      it('should have loaded toolbar [sitecues] module', function (done) {
        session.browser.eval('phantomjs_context.toolbar', function (error, value) {
          expect(value).to.have.ownProperty('STATES');
          expect(value.STATES).to.have.ownProperty('OFF');
          expect(value.STATES).to.have.ownProperty('ON');
          expect(value).to.have.ownProperty('currentState');
          expect(value).to.have.ownProperty('render');
          expect(value).to.have.ownProperty('show');
          expect(value).to.have.ownProperty('slideOut');
          expect(value).to.have.ownProperty('slideIn');
          expect(value).to.have.ownProperty('toggle');
          expect(value).to.have.ownProperty('enableSpeech');
          expect(value).to.have.ownProperty('disableSpeech');
          expect(value).to.have.ownProperty('wireEvents');
          expect(value).to.have.ownProperty('disable');
          expect(value).to.have.ownProperty('enable');
          done();
        });
      });
    });
  });
});