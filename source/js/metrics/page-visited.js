/*
 * Create and send a metric event when the library loads on the page.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 * (Send it only once when the user goes to a new page)
 */
sitecues.def('metrics/page-visited', function(pageVisited, callback, log) {

    var instance = null;

    sitecues.use('jquery', 'ui', function($) {

        var PageVisited = (function() {
            // Constructor.
            function PageVisited() {
                // Init default values.
                this.data = {'name': 'page-visited'};
            };

            // Singleton.
            return {
                createInstance: function(options) {
                    return (new PageVisited(options) || null);
                },
                fillData: function(data) {
                   $.extend(instance.data, data);
                },
                sendData: function() {
                    // Send data in JSON format to backend using end point.
                    console.log(JSON.stringify(instance.data));
                    sitecues.emit('metrics/page-visited/sent', this);
                },
                clearData: function() {
                    this.data = {};
                    instance = null;
                }
            };
        })();

        instance = PageVisited.createInstance();

        sitecues.on('metrics/create', function(metrics) {
            console.log('== PAGE VISITED == ');
            PageVisited.fillData(metrics.data);
            PageVisited.sendData();
            PageVisited.clearData();
        });
        
       sitecues.on('metrics/update', function(metrics) {
            // Skip it. We already sent the metrics for this event and do not care about updates.
        });

        // Done.
        callback();
    });
});