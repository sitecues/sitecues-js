/**va
 * The messenger is the text-display component of the toolbar.
 */
sitecues.def('toolbar/messenger', function(messenger, callback){
	sitecues.use( 'jquery', 'conf', function ($, conf) {

		// The queue of messages, including the one that is currently displayed.
        var messageQueue = {};
        // The interval between checks on the queue.  This should be low when a
        // message is active, and high when the queue is empty.
        var pollingInterval = 100;
        // The ID of the currently displayed messge.
        var currentMessageId = 0;

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

			// create messenger
			messenger.messenger = $( '<div class="sitecues-messenger">OMG</div>').appendTo( messenger.wrap );
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
				message.messageId = new Date().getTime() + Math.random();
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
				messenger.timer = setTimeout(messager.poll, pollingInterval);
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
			if (message.messageId === currentMessageId) {
				if (message.display && (message.displayTime + message.ttl) > new Date().getTime()) {
					// Message should stay active
					setTimeout(messager.poll, pollingInterval);
					return;
				}
				// We need to get rid of the current message
				$(message).fadeOut(function() {
					messageQueue.pop();
					setTimeout(messager.poll, 0);
				},'fast');
				return;
			} else {
				// We need to show this message				
				messenger.display(message);
				setTimeout(messager.poll, pollingInterval);
			}
		}

		callback();

	});
});