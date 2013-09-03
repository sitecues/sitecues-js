// Require assertive library.
var
   chai	   = require("chai"),
   expect  = chai.expect;

// Override/mock global browser objects.
window = {'sitecues':
          {'logger': {'log': function() {return 'core';}}},
          'location': {'href': 'localhost'}
          };
document = {'getElementsByTagName': function() {return []},
          'createElement': function() {return {}}};

// Override/mock sitecues object.
sitecues = {'def': function(name, callback){ return callback();},
            'use': function(name, callback){ return callback();}
           };
        //{"log4js":{"version":"1.4.6","edition":"log4javascript","logLog":{"quietMode":false,"debugMessages":["show PopUpAppender"],"numberOfErrors":0,"alertAllErrors":false},"eventTypes":["load","error"],"eventListeners":{"load":[],"error":[]}},"logger":{"version":"Heart.1","ajaxEndpoint":"./logging/ajax/endpoint","layoutPattern":"%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}","appenders":{"popup":{"layout":{"pattern":"%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}","customFields":[{"name":"log-line-version","value":"Heart.1"}]},"eventTypes":["load","unload"],"eventListeners":{"load":[],"unload":[]},"threshold":{"level":30000,"name":"INFO"}}},"toggleItems":{"popup":{"state":false}},"layout":{"pattern":"%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}","customFields":[{"name":"log-line-version","value":"Heart.1"}]}},"coreConfig":{"hosts":{"up":"up.dev.sitecues.com","ws":"ws.dev.sitecues.com"}},"_events":{"toolbar/resized":{"next":{"next":{}},"tail":{}},"hlb/ready":{"next":{"next":{"next":{"next":{"next":{"next":{}}}}}},"tail":{}},"hlb/deflating":{"next":{"next":{"next":{"next":{"next":{}}}}},"tail":{}},"toolbar/message":{"next":{"next":{}},"tail":{}},"speech/enable":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"speech/toggle":{"next":{"next":{}},"tail":{}},"speech/disable":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"speech/stop":{"next":{"next":{}},"tail":{}},"hlb/create":{"next":{"next":{"next":{}}},"tail":{}},"hlb/closed":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"hlb/inflating":{"next":{"next":{}},"tail":{}},"iframe-modal/open":{"next":{"next":{}},"tail":{}},"iframe-modal/closed":{"next":{"next":{}},"tail":{}},"toolbar/disable":{"next":{"next":{}},"tail":{}},"speech/disabled":{"next":{"next":{"next":{}}},"tail":{}},"speech/enabled":{"next":{"next":{"next":{}}},"tail":{}},"zoom/documentScrollbarShow":{"next":{"next":{"next":{}}},"tail":{}},"zoom/documentScrollbarHide":{"next":{"next":{"next":{}}},"tail":{}},"badge/hover":{"next":{"next":{}},"tail":{}},"badge/leave":{"next":{"next":{}},"tail":{}},"resize/end":{"next":{"next":{"next":{}}},"tail":{}},"badge/enable":{"next":{"next":{}},"tail":{}},"ui/toggle":{"next":{"next":{}},"tail":{}},"panel/interaction":{"next":{"next":{}},"tail":{}},"panel/hide":{"next":{"next":{}},"tail":{}},"toolbar/hide":{"next":{"next":{}},"tail":{}},"highlight/animate":{"next":{"next":{}},"tail":{}},"key/esc":{"next":{"next":{"next":{}}},"tail":{}},"inverse/toggle":{"next":{"next":{}},"tail":{}},"inverse/disable":{"next":{"next":{}},"tail":{}},"iframe-modal/show":{"next":{"next":{}},"tail":{}},"iframe-modal/hide":{"next":{"next":{}},"tail":{}},"zoom":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"zoom/increase":{"next":{"next":{"next":{}}},"tail":{}},"zoom/decrease":{"next":{"next":{"next":{}}},"tail":{}}},"configs":{"defined":true}};s

// Require the module file we want to test.
var mod = require("../../source/js/anna_test");

describe('sitecues', function() {
      describe('initial', function() {

        beforeEach(function(done){
          console.log('Before each.....');
          done();
        });

       it('should load & execute the method of simple example', function(done) {
          var res = simple.foo();
          expect(res).to.equal('done');
          done();
        });
        
        it('should load & execute the method of medium example', function(done) {
          var res = mod.medium();
          expect(res).to.equal('done 2');
          done();
        });
        
        it('should load & execute the method of real example', function(done) {
          console.log(mod);
          var res = mod.real();
          expect(res).to.equal('done 3');
          done();
        });

    });
});
