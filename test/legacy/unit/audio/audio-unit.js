require('./../test/bootstrap');

//// Require the module file we want to test.
var modulePath = '../../../source/js/audio/audio',
  audio, // Module
  platform = require('./../data/modules/platform');

describe('audio', function() {
  beforeEach(function() {
    audio = require(modulePath);  // Start fresh each time so that we can test different platforms
  });
  describe('#setSpeechState()', function() {
    it('should turn speech on', function(done) {
      audio.setSpeechState(true);
      var isSpeechOn = audio.isSpeechEnabled();
      expect(isSpeechOn).to.be.equal(true);
      done();
    });
    it('should turn speech off', function(done) {
      audio.setSpeechState(true);
      audio.setSpeechState(false);
      var isSpeechOn = audio.isSpeechEnabled();
      expect(isSpeechOn).to.be.equal(false);
      done();
    });
  });
  describe('#playHlbContent()', function() {
    it('should not throw an exception when TTS is off', function(done) {
      var div = document.createElement('div'),
        hlb = jquery(div);
      audio.setSpeechState(false);
      audio.playHlbContent(hlb);
      done();
    });
    it('should not throw an exception when TTS is on', function(done) {
      var div = document.createElement('div'),
        hlb = jquery(div);
      audio.setSpeechState(true);
      audio.playHlbContent(hlb);
      done();
    });
  });
  describe('#speakCueByName() for html5 audio player', function() {
    it('should not throw an exception', function(done) {
      audio.speakCueByName("[key]");
      done();
    });
  });
  describe('#speakCueByName() for Safari', function() {
    var safariSandbox;

    before(function() {
      safariSandbox = sinon.sandbox.create();
      safariSandbox.stub(platform, 'browser', {
        is: 'Safari',
        isChrome: false,
        isIE: false,
        isSafari: true
      });
    });
    it('should not throw an exception', function(done) {
      audio.speakCueByName("[key]");
      done();
    });
    after(function() {
      safariSandbox.restore();
    });
    describe('#getTTSUrl()', function() {
      it('should return the correct url with language not set', function(done) {
        var actualUrl = audio.getTTSUrl('x y'),
          expectedUrl = '//def/sitecues/api/tts/site/99/tts.aac?l=en-US&t=x%20y';
        expect(actualUrl).to.be.equals(expectedUrl);
        done();
      });
      it('should return the correct url with language set', function(done) {
        Object.defineProperty(document.documentElement, 'lang', {
          value: 'pl',
          writable: true
        });
        var actualUrl = audio.getTTSUrl('x y'),
          expectedUrl = '//def/sitecues/api/tts/site/99/tts.aac?l=pl&t=x%20y';
        expect(actualUrl).to.be.equals(expectedUrl);
        Object.defineProperty(document.documentElement, 'lang', {
          value: undefined,
          writable: true
        });
        done();
      });
    });
  });
  afterEach(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

