/**
 * This is module for common utilities that might need to be used across all
 * of the different metric modules.
 */
sitecues.def('metrics/util', function(metricsUtil, callback, log) {
    'use strict';

   var toClass = {}.toString;

    // Define dependency modules.
    sitecues.use('conf/site', 'jquery', 'ui', function(site, $) {

        metricsUtil.send = function(instance) {
            // Send data in JSON format to backend using end point.
            var siteId =  site.get('site_id');
            var request = $.ajax({
                xhrFields: {
                  withCredentials: true
                },
                crossDomain: true,
                beforeSend: function(xhrObj){
                    xhrObj.setRequestHeader("Content-Type","application/json");
                    xhrObj.setRequestHeader("Accept","application/json");
                },
                url: '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/metrics/site/' + siteId + '/notify.json',
                type: "POST",
                data: instance && JSON.stringify(instance.data),
                dataType: "json"
            });

            request.done(function(msg) {
                console.log('Request succeeded', msg);
            });

            request.fail(function(jqXHR, textStatus) {
                console.log("Request failed: " + textStatus);
            });
        };

        metricsUtil.update = function(instance, newData, event) {
            // Object is passed.
            var newDataType = newData ? toClass.call(newData).slice(8, -1) : undefined;
            if (newDataType === 'Object') {
                for (var prop in newData) {
                    instance.data[prop] = newData[prop];
                }
            } else {
                var prop  = arguments[0],
                    value = arguments[1];
                instance.data[prop] = value;
            }

            if (event) {
                sitecues.emit(event, instance);
            }
        };
        // Done.
        callback();
    });
});