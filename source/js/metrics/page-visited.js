/*
 * Create and send a metric event when the library loads on the page.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 * (Send it only once when the user goes to a new page)
 */
sitecues.def('metrics/page-visited', function(pageVisited, callback, log) {

    var instance = null;

    sitecues.use('metrics/util', 'jquery', 'ui', function(metricsUtil, $) {

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
                sendData: metricsUtil.send,
                clearData: function() {
                    this.data = {};
                    instance = null;
                }
            };
        })();

        instance = PageVisited.createInstance();

        sitecues.on('metrics/ready', function(metrics) {
            PageVisited.fillData(metrics.data);
            PageVisited.sendData(instance);
            //  We already sent the metrics for this event, no need to keep the intance.
            instance = null;
        });

        // Done.
        callback();
    });
});