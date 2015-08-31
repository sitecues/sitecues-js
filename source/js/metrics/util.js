/**
 * This is module for common utilities that might need to be used across all
 * of the different metric modules.
 */
// Define dependency modules.
define(['conf/site', '$'], function(site, $) {

  var toClass = {}.toString;

  function send(instance) {
    if (SC_LOCAL) {
      // Cannot save to server when we have no access to it
      // Putting this condition in allows us to paste sitecues into the console
      // and test it on sites that have a content security policy
      return;
    }

    // Send data in JSON format to backend using end point.
    var siteId =  site.getSiteId();
    // Update timestamp before send.
    update(instance, {'client_time_ms': +new Date()});

    var request = $.ajax({
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      beforeSend: function(xhrObj){
        xhrObj.setRequestHeader('Content-Type', 'application/json');
        xhrObj.setRequestHeader('Accept', 'application/json');
      },
      url: sitecues.getApiUrl('metrics/site/' + siteId + '/notify.json'),
      type: 'POST',
      data: instance && JSON.stringify(instance.data),
      dataType: 'json'
    });

    request.done(function() {
//                console.log('Request succeeded', msg);
    });

    request.fail(function() {
//                console.log("Request failed: " + textStatus);
    });
  }

  function update(instance, newData, event) {
    // Object is passed.
    var newDataType = newData ? toClass.call(newData).slice(8, -1) : undefined;
    if (newDataType === 'Object') {
      $.extend(instance.data, newData);
    }

    if (event) {
      sitecues.emit(event, instance);
    }
    return instance;
  }

  var publics = {
    send: send,
    update: update
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
