sitecues.def('jquery', function(module, callback, log) {
  sitecues.use('load', function(load) {
    load.script('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js', function() {
      if (typeof jQuery !== 'undefined') {
        sitecues.$ = jQuery.noConflict(true);
        if (window.XDomainRequest) {
          sitecues.$.ajaxTransport(function(s) {
            if (s.crossDomain && s.async) {
              if (s.timeout) {
                s.xdrTimeout = s.timeout;
                delete s.timeout;
              }
              var xdr;
              return {
                send: function(_, complete) {
                            alert()
                  function callback(status, statusText, responses, responseHeaders) {
                    xdr.onload = xdr.onerror = xdr.ontimeout = sitecues.$.noop;
                    xdr = undefined;
                    complete(status, statusText, responses, responseHeaders);
                  }
                  xdr = new XDomainRequest();
                  xdr.onload = function() {
                    callback(200, 'OK', { text: xdr.responseText }, 'Content-Type: ' + xdr.contentType);
                  };
                  xdr.onerror = function() {
                    callback(404, 'Not Found');
                  };
                  xdr.onprogress = sitecues.$.noop;
                  xdr.ontimeout = function() {
                    callback(0, 'timeout');
                  };
                  xdr.timeout = s.xdrTimeout || Number.MAX_VALUE;
                  xdr.open(s.type, s.url);
                  xdr.send((s.hasContent && s.data) || null);
                },
                abort: function() {
                  if (xdr) {
                    xdr.onerror = sitecues.$.noop;
                    xdr.abort();
                  }
                }
              };
            }
          });
        }
        callback(sitecues.$);
      }
    });
  });
});
