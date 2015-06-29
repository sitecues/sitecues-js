/*
 * Create and send a metric event when the user clicks to send feedback.
 */
sitecues.def('metrics/feedback-sent', function (feedbackSent, callback) {

    'use strict';

    var DEFAULT_STATE = {'name': 'feedback-sent'};

    sitecues.use('metrics/util', 'jquery', function (metricsUtil) {

        // ============= Objects methods ======================
        feedbackSent = {
            init: function() {
              feedbackSent.data = {
                'name': 'feedback-sent'
              };
            },
            update: function(data) {
                metricsUtil.update(feedbackSent, data);
            },
            send: function() {
                metricsUtil.send(feedbackSent);
            },
            reset: function() {
                feedbackSent.update(DEFAULT_STATE);
            }
        };

        // ============= Events Handlers ======================
        // Create an instance on panel show event.
        sitecues.on('feedback/do-send', function(text, rating) {
            if (!feedbackSent.data) {
                feedbackSent.init();
            }
            feedbackSent.data.feedbackText = text;
            feedbackSent.data.rating = rating; // 0 = no rating, otherwise 1-5 stars
            sitecues.emit('metrics/feedback-sent/create');
            feedbackSent.send();
        });

        sitecues.on('metrics/ready metrics/update', function(metrics) {
            feedbackSent.data && feedbackSent.update(metrics.data);
        });

        // Done.
        callback();
    });
});