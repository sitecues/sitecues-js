/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
sitecues.def('metrics/badge-hovered', function(badgeHovered, callback, log) {

    var DEFAULT_STATE = {'name': 'badge-hovered'};

    sitecues.use('metrics/util', 'jquery', 'ui', function(metricsUtil,$) {

        // ============= Objects methods ======================
        badgeHovered = {
            init: function() {
                this.data = DEFAULT_STATE;
            },
            update: function(data) {
                metricsUtil.update(this, data);
            },
            send: function() {
                metricsUtil.send(this);
            },
            reset: function() {
                this.update(DEFAULT_STATE);
            }
        };

        // ============= Events Handlers ======================
        // Create an instance on panel show event.
        sitecues.on('panel/show', function() {
            if (!badgeHovered['data']) {
                badgeHovered.init();
            }
            sitecues.emit('metrics/badge-hovered/create');
            badgeHovered.send();
        });

        sitecues.on('metrics/ready metrics/update', function(metrics) {
            console.log(this);
            badgeHovered['data'] && badgeHovered.update(metrics.data);
        });

        // Clear an instance data on panel hide event.
        sitecues.on('panel/hide', function() {
            console.log(this);
            badgeHovered.reset();
        });

        // Done.
        callback();
    });
});