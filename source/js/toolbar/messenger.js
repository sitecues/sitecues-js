/**va
 * The messenger is the text-display component of the toolbar.
 */
sitecues.def('toolbar/messenger', function(messenger, callback, console){
	sitecues.use( 'jquery', 'conf', function ($, conf) {

		// The queue of messages, including the one that is currently displayed.
        var messageQueue = [];
        // The interval between checks on the queue.  This should be low when a
        // message is active, and high when the queue is empty.
        var pollingInterval = 100;
        // The ID of the currently displayed messge.
        messenger.currentMessageId = 0;

		/**
		 * We're not going to do this automatically as we need to make sure the
		 * toolbar is on the page to set up the listeners properly. Otherwise
		 * we'd have to set the .on() methods to document scope which would be a
		 * performance hit.
		 *
		 * @return void
		 */
		messenger.build = function(toolbar) {
			// create clider messenger.wrap element
			messenger.wrap = $( '<div>' ).addClass( 'messenger-wrap' ).appendTo(toolbar);
		},

		/**
		 * Queues a message for display.
		 *
		 * @param  message An object with the following properties:
		 *         .content  HTML     The content of the message, as HTML.
		 *         .ttl      long     The lifespan of the message, in ms
		 *         .display  boolean  Should the message be displayed?
		 *         					  If false, the message will be dequeued.
		 */
		messenger.queue = function(message) {
			if(message.display && message.content && message.ttl) {
				message.messageId = new Date().getTime() + '-' + Math.round(100000 * Math.random());
				messageQueue.push(message);
				messenger.poll();
			}
		},

		/**
		 * Starts the loop to process the queue.
		 * @return void
		 */
		messenger.start = function() {
			if(messenger.timer === undefined) {
				messenger.timer = setTimeout(messenger.poll, pollingInterval);
			}
		},

		/**
		 * Monitors the queue and processes the messages.
		 * @return void
		 */
		messenger.poll = function() {
			if(messageQueue.length === 0) {
				// No messages, stop polling
				messenger.monitor = null;
				return;
			}
			var message = messageQueue[0];
			if (message.messageId === messenger.currentMessageId) {
				if (message.display && (message.displayTime + message.ttl) > new Date().getTime()) {
					// Message should stay active
					setTimeout(messenger.poll, pollingInterval);
					return;
				}
				// We need to get rid of the current message
				var oldElement = $('#sitecues-message-' + message.messageId);
				if(oldElement.length > 0) {
					// The old element exists, get rid of it
					oldElement.fadeOut('fast', function() {
						$(this).remove();
						messageQueue.pop();
						setTimeout(messenger.poll, 0);
					});
				} else {
					// The old element doesn't exist Note: This is duplicated
					// from above because we're doing it above on the fadeout's
					// success.
					messageQueue.pop();
					setTimeout(messenger.poll, 0);
				}
				return;
			} else {
				// We need to show this message
				messenger.display(message);
				setTimeout(messenger.poll, pollingInterval);
			}
		}

		messenger.display = function(message) {
			var existing = $('.sitecues-messenger .message');
			if(existing.length > 0) {
				// Clear the old one and re-enter this function
				existing.fadeOut('fast', function() {
					existing.remove();
					messenger.display(message);
				})
				return;
			}
			messenger.currentMessageId = message.messageId;
			message.displayTime = new Date().getTime();
			var container = $('<div class="message" />')
				.attr('id', 'sitecues-message-' + message.messageId)
				.html(message.content);
			$('.sitecues-messenger').empty().append(container);
		}

        sitecues.on( 'toolbar/message', function (message) {
            messenger.queue(message);
        } );

		callback();

	});
});