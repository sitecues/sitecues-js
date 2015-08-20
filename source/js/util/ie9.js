/**
 * Implements IE9-specific code
 */
define(['jquery'], function($) {
  'use strict';

  function init() {
    initIE9Cors();
  }

  /* Automatic Cross Origin Resource Sharing support using the XDomainRequest object for
   * IE8 and IE9 when using the $.ajax function in jQuery 1.5+.
   */
  function initIE9Cors() {

    var xmlRegEx = /\/xml/i;

    $.ajaxTransport('text html xml json', function(options, userOptions) {
      //https://github.com/MoonScript/jQuery-ajaxTransport-XDomainRequest
      var xdr = null,
        userType = (userOptions.dataType||'');

      userType = userType.toLowerCase ? userType.toLowerCase() : userType;

      return {
        'send' : function(headers, complete) {
          xdr = new XDomainRequest();
          if (/^\d+$/.test(userOptions.timeout)) {
            xdr.timeout = userOptions.timeout;
          }
          xdr.ontimeout = function(){
            complete(500, 'timeout');
          };
          xdr.onload = function() {
            var allResponseHeaders = 'Content-Length: ' + xdr.responseText.length + '\r\nContent-Type: ' + xdr.contentType,

              status = {
                'code'   : 200,
                'message': 'success'
              },
              responses = {
                'text': xdr.responseText
              },
              doc;

            try {
              if (userType === 'json') {
                try {
                  responses.json = JSON.parse(xdr.responseText);
                } catch(e) {
                  status.code = 500;
                  status.message = 'parseerror';
                }
              } else if ((userType === 'xml') || ((userType !== 'text') && xmlRegEx.test(xdr.contentType))) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = false;
                try {
                  doc.loadXML(xdr.responseText);
                } catch(e) {
                  doc = undefined;
                }
                if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) {
                  status.code = 500;
                  status.message = 'parseerror';
                  throw 'Invalid XML: ' + xdr.responseText;
                }
                responses.xml = doc;
              }
            } catch(parseMessage) {
              throw parseMessage;
            } finally {
              complete(status.code, status.message, responses, allResponseHeaders);
            }
          };
          xdr.onerror = function(){
            complete(500, 'error', {
              text: xdr.responseText
            });
          };
          xdr.open(options.type, options.url);
          xdr.send();
        },
        abort: function() {
          if (xdr) {
            xdr.abort();
          }
        }
      };
    });
  }

  return {
    init: init
  };
});

