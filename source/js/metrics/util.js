/**
 * This is module for common utilities that might need to be used across all
 * of the different metric modules.
 */
sitecues.def('metrics/util', function (metricsUtil, callback) {
    'use strict';

    var toClass = {}.toString;

    // Define dependency modules.
    sitecues.use('conf/site', 'jquery', 'user', function(site, $) {

        metricsUtil.send = function(instance) {
          if (SC_LOCAL) {
            // Cannot save to server when we have no access to it
            // Putting this condition in allows us to paste sitecues into the console
            // and test it on sites that have a content security policy
            return;
          }

            // Send data in JSON format to backend using end point.
            var siteId =  site.getSiteId();
            // Update timestamp before send.
            metricsUtil.update(instance, {'client_time_ms': +new Date});

            var request = $.ajax({
                xhrFields: {
                  withCredentials: true
                },
                crossDomain: true,
                beforeSend: function(xhrObj){
                    xhrObj.setRequestHeader("Content-Type","application/json");
                    xhrObj.setRequestHeader("Accept","application/json");
                },
                url: sitecues.getApiUrl('metrics/site/' + siteId + '/notify.json'),
                type: "POST",
                data: instance && JSON.stringify(instance.data),
                dataType: "json"
            });

            request.done(function() {
//                console.log('Request succeeded', msg);
            });

            request.fail(function() {
//                console.log("Request failed: " + textStatus);
            });
        };

        metricsUtil.update = function(instance, newData, event) {
            // Object is passed.
            var newDataType = newData ? toClass.call(newData).slice(8, -1) : undefined;
            if (newDataType === 'Object') {
                $.extend(instance.data, newData);
            }

            if (event) {
                sitecues.emit(event, instance);
            }
            return instance;
        };
        // Done.
        callback();
    });
});