/**
 * This file contain unit test(s) for style.js file.
 * TODO: since lines 5-35 most probably will be repeated in each test file we create
 * I'd take this code out to a sharing file and then require it when necessary.
 */

// Require assertive library.
var
   chai	   = require("chai"),
   expect  = chai.expect;

// Require other libraries we need.
var jquery = require("jquery"),
    jsdom = require("jsdom");

// Create a basic document with empty <head> and <body> tags; DOM level 3.
var document = jsdom.jsdom();
var window = document.parentWindow;

// Create & insert a new element we will later use for tests.
var node = document.createElement("p");
node.setAttribute("id", "sitecues");
document.getElementsByTagName('body')[0].appendChild(node);

// Override/mock sitecues object.
var def = function(name, callback){
  var module = {};
  var cb = function(){};
  return callback(module, cb);
};

sitecues = {'def': def,
            'use': function(name, callback){ return callback(jquery);}
           };
          //{"log4js":{"version":"1.4.6","edition":"log4javascript","logLog":{"quietMode":false,"debugMessages":["show PopUpAppender"],"numberOfErrors":0,"alertAllErrors":false},"eventTypes":["load","error"],"eventListeners":{"load":[],"error":[]}},"logger":{"version":"Heart.1","ajaxEndpoint":"./logging/ajax/endpoint","layoutPattern":"%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}","appenders":{"popup":{"layout":{"pattern":"%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}","customFields":[{"name":"log-line-version","value":"Heart.1"}]},"eventTypes":["load","unload"],"eventListeners":{"load":[],"unload":[]},"threshold":{"level":30000,"name":"INFO"}}},"toggleItems":{"popup":{"state":false}},"layout":{"pattern":"%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}","customFields":[{"name":"log-line-version","value":"Heart.1"}]}},"coreConfig":{"hosts":{"up":"up.dev.sitecues.com","ws":"ws.dev.sitecues.com"}},"_events":{"toolbar/resized":{"next":{"next":{}},"tail":{}},"hlb/ready":{"next":{"next":{"next":{"next":{"next":{"next":{}}}}}},"tail":{}},"hlb/deflating":{"next":{"next":{"next":{"next":{"next":{}}}}},"tail":{}},"toolbar/message":{"next":{"next":{}},"tail":{}},"speech/enable":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"speech/toggle":{"next":{"next":{}},"tail":{}},"speech/disable":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"speech/stop":{"next":{"next":{}},"tail":{}},"hlb/create":{"next":{"next":{"next":{}}},"tail":{}},"hlb/closed":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"hlb/inflating":{"next":{"next":{}},"tail":{}},"iframe-modal/open":{"next":{"next":{}},"tail":{}},"iframe-modal/closed":{"next":{"next":{}},"tail":{}},"toolbar/disable":{"next":{"next":{}},"tail":{}},"speech/disabled":{"next":{"next":{"next":{}}},"tail":{}},"speech/enabled":{"next":{"next":{"next":{}}},"tail":{}},"zoom/documentScrollbarShow":{"next":{"next":{"next":{}}},"tail":{}},"zoom/documentScrollbarHide":{"next":{"next":{"next":{}}},"tail":{}},"badge/hover":{"next":{"next":{}},"tail":{}},"badge/leave":{"next":{"next":{}},"tail":{}},"resize/end":{"next":{"next":{"next":{}}},"tail":{}},"badge/enable":{"next":{"next":{}},"tail":{}},"ui/toggle":{"next":{"next":{}},"tail":{}},"panel/interaction":{"next":{"next":{}},"tail":{}},"panel/hide":{"next":{"next":{}},"tail":{}},"toolbar/hide":{"next":{"next":{}},"tail":{}},"highlight/animate":{"next":{"next":{}},"tail":{}},"key/esc":{"next":{"next":{"next":{}}},"tail":{}},"inverse/toggle":{"next":{"next":{}},"tail":{}},"inverse/disable":{"next":{"next":{}},"tail":{}},"iframe-modal/show":{"next":{"next":{}},"tail":{}},"iframe-modal/hide":{"next":{"next":{}},"tail":{}},"zoom":{"next":{"next":{"next":{"next":{}}}},"tail":{}},"zoom/increase":{"next":{"next":{"next":{}}},"tail":{}},"zoom/decrease":{"next":{"next":{"next":{}}},"tail":{}}},"configs":{"defined":true}};s
getComputedStyle = null;

// Require the module file we want to test.
var style = require("../../source/js/style");

describe('sitecues', function() {
      describe('initial', function() {
       it('should load & execute the method of simple example', function(done) {
          var res = style.real(document.getElementById('sitecues'));
          expect(res).to.be.ok;
          expect(res).to.be.an('object');
          expect(res).to.eql({});
          done();
        });

    });
});
