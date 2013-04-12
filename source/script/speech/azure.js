/**
 * This is the library that deals with the Azure (formerly Bing) 
 * TTS service.  Note that there is a copy of Robovoice embedded
 * in this file.  It is here because we don't need Robovoice for
 * anything else and it is unlikely to be updated by the developer.
 */
eqnx.def('speech/azure', function(azure, callback) {

    eqnx.use('jquery', 'conf', 'conf/remote', function (_jQuery, conf, remote) {

        azure.factory = function(hlb) {
        	console.log(remote.azureAccessToken.accessToken);
        	var roboVoice = new RoboVoice(remote.azureAccessToken.accessToken);
        	return new AzurePlayer(hlb, roboVoice, conf, _jQuery, remote);
        }
    });

    // end
    callback();

});

function AzurePlayer(_hlb, _roboVoice, conf, _jQuery, _remote) {

	var hlb;
	if(hlb instanceof _jQuery) {
		hlb =_hlb;
	} else {
		hlb = _jQuery(_hlb);
	}
	var roboVoice = _roboVoice;
	var remote = _remote;

	this.play = function() {
		var tokenTTL = remote.azureAccessToken.expires - new Date().getTime();
		if(tokenTTL < 30000) {
			console.log("Token has expired, re-fetching...");
			this.fetchToken();
		} else {
			console.log("Token expires in " + tokenTTL + "ms");
		}
		console.log("Playing via azure: " + hlb.text());
		roboVoice.speak(hlb.text(), "en");
	}

	this.stop = function() {
		console.log("Stopping azure player");
		roboVoice.stop();
	}

	this.destroy = function() {
		console.log("Destroying azure player");
		this.stop();
	}

	this.fetchToken = function() {
		remote.fetch();
	}

}

/*!
 * RoboVoice Speaker
 * Version: 1.1
 * Author: Mikhail Nasyrov, http://mnasyrov.com
 */ 

(function() {

var window = this;
var document = window.document;

// Helpers -------------------------------------

var _ = (function() {

	// General helpers -------------------------------------

	this.extend = function(obj) {
		var sources = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < sources.length; i++) {
			var source = sources[i];
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
		return obj;
	};

	this.defer = function(func) {
		setTimeout(func, 0);
	};

	this.isArray = Array.isArray || function(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	};

	this.isString = function(obj) {
		return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
	};

	this.isNumber = function(obj) {
		return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
	};
	
	// DOM helpers -------------------------------------

	this.addEvent = function (element, eventName, handler, custom) {
		if (!element || !eventName || !handler) return;

		if (element.attachEvent) {
			if (!custom) {
				eventName = "on" + eventName;
			}
			element.attachEvent(eventName, function () { 
				handler.apply(element, arguments); 
			});
		}
		else if (element.addEventListener) {
			element.addEventListener(eventName, handler, false);
		}
	};
	
	this.addCustomEvent = function (element, eventName, handler) {
		this.addEvent(element, eventName, handler, true);
	};

	this.loadScript = function (url, container) {
		container = container || document.head || document.body;
		
		var script = document.createElement("script");
		script.setAttribute("type", "text/javascript");
		script.setAttribute("src", url);
		container.appendChild(script);
		return script;
	};

	this.removeElement = function (el) {
		if (el) {
			(document.head || document.body).removeChild(el);
		}
	};

	this.getNewUid = function() {
		return "RoboVoiceSpeaker_" + (+new Date);
	};

	// Text helpers -------------------------------------
	
	this.clean = function(str) {
		if (!str) 
			return str;
		return this.trim(str.replace(/\s+/g, ' '));
	}
	
	this.trim = function(str) {
		if (!str) 
			return str;
		return str.replace(/^[\s]+|[\s]+$/g, '');
	}	
	
	// Chops a text by words
	this.chop = function (text, partSize) {				
		text = _.clean(text || "");		
		
		if (!text) {
			return [];
		}

		if (!(partSize > 0)) {
			return [text];
		}
	
		var parts = [];
		var words = text.split(" ");
		var currentPart = "";		
		
		for (var word = words.shift(); !!word; word = words.shift()) {
		
			if (word.length > partSize) {
				var w1 = word.substr(0, partSize);
				var w2 = word.substr(partSize);
				words = [w2].concat(words);
				word = w1;
			}
			
			if (currentPart.length + word.length + 1 > partSize) {
				parts.push(currentPart);
				currentPart = "";
			}
			
			if (currentPart.length > 0)
				currentPart += " ";
			currentPart += word;
		}
		
		if (currentPart.length > 0) {
			parts.push(currentPart);
		}
		
		return parts;
	}

	// Ajax helpers -------------------------------------

	this.jsonp = function (url, data, callback) {
		var jsonpCallbackName = "jsonp" + (+new Date);

		url += "?oncomplete=" + jsonpCallbackName;
		
		if (data) {
			url += "&" + this.makeQueryString(data);
		}

		var scriptElement = null;
		var self = this;

		// Handle JSONP-style loading
		window[jsonpCallbackName] = function (data) {
			if (callback) {
				callback.apply(this, arguments);
			}
			// Garbage collect
			window[jsonpCallbackName] = undefined;

			try {
				delete window[jsonpCallbackName];
			}
			catch (e) { }

			self.removeElement(scriptElement);
		};

		scriptElement = this.loadScript(url);
	};

	this.makeQueryString = function (data) {
		var s = [];
		for (var key in data) {
			this._addParam(s, key, data[key]);
		}
		return s.join("&").replace(/%20/g, "+");
	};

	this._addParam = function (query, key, value) {
		query[query.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
	};

	return this;	
}).call({});
// HtmlAudioPlayer -------------------------------------

function HtmlAudioPlayer(audioElement) {
	this._player = audioElement;
	if (!this._player) {
		this._player = document.createElement('audio');	
		document.body.appendChild(this._player);
	}

	this._playlist = [];

	this.onDataLoaded = null;	
	
	var self = this;
	_.addEvent(this._player, "loadeddata", function () {
		if (self.onDataLoaded) self.onDataLoaded();
	});
	_.addEvent(this._player, "ended", function () {
		self._onPlaybackEnded();
	});
};

HtmlAudioPlayer.canPlayWav = function() {
	var a = document.createElement('audio');
	return !!(a.canPlayType && a.canPlayType('audio/wav; codecs="1"').replace(/no/, ''));
};

(function () {

	// Public members -------------------------------------

	this.play = function (url) {
		if (url) {
			this._player.src = url;
			this._player.load();
		}
		this._player.play();
	};

	this.pause = function () {
		this._player.pause();
	};

	this.stop = function () {
		this._player.pause();
	};
	
	this.addToPlaylist = function(url) {
		if (this.isStopped()) {
			this.play(url);
		}
		else {				
			this._playlist.push(url);
		}
	};
	
	this.clearPlaylist = function() {
		this.stop();
		this._playlist = [];
	};
	
	this.isStopped = function() {
		var stopped = this._player.ended || this._player.paused;
		return stopped;
	};
	
	// Private members -------------------------------------
	
	this._onPlaybackEnded = function() {
		var nextItem = this._playlist.shift();
		if (nextItem) {
			this.play(nextItem);
		}
	};
	
}).call(HtmlAudioPlayer.prototype);
// WMAudioPlayer -------------------------------------

function WMAudioPlayer() {
	this._playerId = _.getNewUid();
	this._player = null;
	this._playlist = [];
	this.onDataLoaded = null;	
	
	this._createPlayer();
};

(function () {
	
	// Public members -------------------------------------
	
	this.play = function(url) {
		if (!this._player) return;
		
		if (url) {
			this._player.URL = url;
			this._player.controls.play();
		}
		else if (this.isPaused()) {
			this._player.controls.play();
		}		
	};

	this.pause = function() {
		if (this._player) {
			this._player.controls.pause();	
		};
	};

	this.stop = function() {
		if (!this._player) return;
		
		this._player.controls.stop();
	};
	
	this.addToPlaylist = function(url) {
		if (this.isStopped()) {
			this.play(url);
		}
		else {				
			this._playlist.push(url);
		}
	};
	
	this.clearPlaylist = function() {
		this.stop();
		this._playlist = [];
	};
	
	this.isStopped = function() {
		var playState = (this._player && this._player.playState) || this._wmStates.stopped;
		var stopped = playState == 1 || playState == 2 || playState == 10;
		return stopped;
	};

	this.isPaused = function() {
		var playState = (this._player && this._player.playState) || this._wmStates.unknown;
		return playState == 2;
	};
	
	// Private members -------------------------------------

	this._onPlaybackEnded = function() {
		var nextItem = this._playlist.shift();
		if (nextItem) {
			this.play(nextItem);
		}
	};
	
	this._createPlayer = function () {
		var containerId = this._playerId + "_container";
		
		var container = document.createElement("span");
		container.setAttribute("id", containerId);
		container.setAttribute("style", "width: 1px, height: 1px; position: absolute; top: -10000px; left: -10000px;");
		
		document.body.appendChild(container);
		
		container.innerHTML = ''
			+ '<object id="' + this._playerId + '" '
			+ 'width="0" height="0" classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" '
			+ 'type="application/x-oleobject">'
			+ '<param name="SendPlayStateChangeEvents" value="True">'
			+ '<param name="uiMode" value="none">'
				+ '<embed type="application/x-mplayer2" width="0" height="0" uiMode="none" '
				+	'type="application/x-ms-wmp" '
				+	'SendPlayStateChangeEvents="true" '
				+	'pluginspage="http://www.microsoft.com/Windows/MediaPlayer/"></embed>'
			+ '</object>';

		var self = this;
		_.defer(function() { self._initPlayer(); });
	};
	
	this._initPlayer = function() {
		var player = document.getElementById(this._playerId);
		if (player && !player.controls) {
			player = player.getElementsByTagName('embed');
			if (player) {
				player = player[0];
			}
		}
		
		if (player && player.controls) {		
			this._player = player;
			player.settings.volume = 100; //Set max volume
			
			var self = this;
			_.addCustomEvent(player, 'playStateChange', function(newState) {
				self._dispatchPlayState(newState);
			});
		}
	};
	
	this._wmStates = {
		unknown: 0,			//Windows Media Player is in an undefined state.
		stopped: 1,			//Playback of the current media item is stopped.
		paused: 2,			//Playback of the current media item is paused. When a media item is paused, resuming playback begins from the same location.
		playing: 3,			//The current media item is playing.
		scanForward: 4,		//The current media item is fast forwarding.
		scanReverse: 5,		//The current media item is fast rewinding.
		buffering: 6,		//The current media item is getting additional data from the server.
		waiting: 7,			//Connection is established, but the server is not sending data. Waiting for session to begin.
		mediaEnded: 8,		//Media item has completed playback.
		transitioning: 9,	//Preparing new media item.
		ready: 10,			//Ready to begin playing.
		reconnecting: 11	//Reconnecting to stream.
	};
	
	this._dispatchPlayState = function(newState) {
		if (newState == this._wmStates.mediaEnded) {
			var self = this;
			_.defer(function() { self._onPlaybackEnded(); });
		}
	}
	
}).call(WMAudioPlayer.prototype);

// RoboVoice -------------------------------------

function RoboVoice(options) {
	var defaults = _.extend({}, this.defaults);

	if (_.isString(options)) {
		defaults.appId = options;
		options = null;
	}

	this.options = _.extend(defaults, options || {});
	
	this._currentLanguage = 'auto';	
	this._isPaused = false;
	this._textPartQueue = [];
	this._player = this._createAudioPlayer();
};

// RoboVoice prototype -------------------------------------
(function () {

	// Public members -------------------------------------

	this.defaults = {
		appId: null,
		allowedLanguages: ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'zh-chs', 'zh-cht'],				
		autoSplitSize: 512,	
		disableAudio: false,

		// Callbacks
		onLangDetected: null,		
		onLangFailed: null,
		onAudioUrlLoaded: null,		
		onTextPartCompleted: null,
		onTextQueueEmpty: null,
		onTextPartFailed: null
	};

	this.detectLanguage = function(text, callback) {
		text = _.clean(text);

		_.jsonp(
			this._apiUrl + "Detect",
			{ 
				'appId': this.options.appId, 
				'text': text
			},
			callback
		);
	};

	this.getAvailableLanguages = function(callback) {		
		_.jsonp(
			this._apiUrl + "GetLanguagesForSpeak",
			{ 
				'appId': this.options.appId 
			},
			callback
		);
	};

	this.getLanguageName = function(language, callback, locale) {
		locale = locale || 'en';

		_.jsonp(
			this._apiUrl + "GetLanguageNames",
			{ 
				'appId': this.options.appId,
				'locale': locale,
				'languageCodes': '["' + language + '"]'
			},
			callback
		);
	};

	this.isPaused = function() {
		return this._isPaused;	
	};

	this.pause = function() {
		this._isPaused = true;
		this._player.pause();			
	};

	this.resume = function() {
		this._player.play();
		this._isPaused = false;
	}

	this.speak = function (text, language) {
		this.stop();

		language = language || 'auto';			
		text = this._validateTextParts(text);

		if (text && text.length > 0) {
			this._currentLanguage = language;
			this._textPartQueue = text;
			this._speakTextPartQueue();
		}
	};

	this.stop = function() {
		this._player.stop();
		this._player.clearPlaylist();
		this._textPartQueue = [];
		this._isPaused = false;
	};	

	// Private members -------------------------------------

	this._apiUrl = "//api.microsofttranslator.com/V2/Ajax.svc/";

	this._doCallback = function(callback) {
		if (callback) {
			var args = Array.prototype.slice.call(arguments, 1);
			return callback.apply(this, args);
		}
	}

	this._createAudioPlayer = function(audioElement) {
		if (audioElement) {
			return new HtmlAudioPlayer(audioElement);
		}

		if (!HtmlAudioPlayer.canPlayWav()) {
			return new WMAudioPlayer();	
		}			
		
		return new HtmlAudioPlayer();
	}

	this._validateTextParts = function(text) {
		var parts = null;

		if (text) {
			if (_.isString(text) || _.isNumber(text)) {
				parts = [text];
			}
			else if (_.isArray(text)) {				
				parts = text;
			}
		}

		if (!parts) {
			return null;
		}

		var resultParts = [];
			
		for (var i = 0; i < parts.length; i++) {
			var item = parts[i];

			if (!_.isString(item) && !_.isNumber(item)) {
				continue;
			}

			if (this.options.autoSplitSize > 0) {
				item = _.clean(item);

				var splitParts = _.chop(item, this.options.autoSplitSize);
				
				for (var partIndex = 0; partIndex < splitParts.length; partIndex++) {
					var textPart = splitParts[partIndex];
					if (textPart && textPart.length > 0) {
						textPart = this._escapeStringChars(textPart);
						resultParts.push(textPart);
					}
				}
			}
			else {
				item = _.clean(item);
				item = this._escapeStringChars(item);
				resultParts.push(item);
			}
		}

		return resultParts;
	}		

	this._speakTextPartQueue = function() {
		if (this._textPartQueue.length > 0) {
			var nextPart = this._textPartQueue.shift();

			// Skip empty parts
			while (!nextPart && this._textPartQueue.length > 0) {
				nextPart = this._textPartQueue.shift();	
			}			

			if (nextPart) {
				this._speakTextPart(nextPart, this._currentLanguage);
			}
		}		
		else {
			this._doCallback(this.options.onTextQueueEmpty);
		}
	}

	this._speakTextPart = function(text, language) {
		var self = this;
				
		language = language || 'auto';

		if (text) {
			var isLanguageValid = this._validateLanguage(language) || language == 'auto';
			
			if (isLanguageValid) {
				if (language == 'auto') {				
					this._autoDetectLanguage(text, 
						function(detectedLanguage) {
							self._speakValidatedTextPart(text, detectedLanguage);
						},
						function(detectedLanguage) {
							var callback = self.options.onLangFailed || self.options.onTextPartFailed;
							self._doCallback(callback, text, detectedLanguage);
							self._speakTextPartQueue();
						}
					);
				}
				else {
					this._speakValidatedTextPart(text, language);
				}
			}
			else {
				var callback = self.options.onLangFailed || self.options.onTextPartFailed;
				self._doCallback(callback, text, language);
				self._speakTextPartQueue();
			}		
		}		
	}

	this._speakValidatedTextPart = function(text, language) {
		var self = this;

		this._requestAudioUrl(text, language, 
			function() { 
				self._doCallback(self.options.onTextPartCompleted, text, language);
				self._speakTextPartQueue();
			},
			function(text, language) { 
				self._doCallback(self.options.onTextPartFailed, text, language); 
				self._speakTextPartQueue();
			}
		);
	}

	this._requestAudioUrl = function(text, language, onSuccess, onFailure) {
		var self = this;

		this._currentLanguage = language;
		
		text = _.clean(text);

		_.jsonp(
			this._apiUrl + "Speak",
			{
				'appId': this.options.appId,
				'language': language,
				'format': 'audio/wav',
				'text': text
			},
			function (audioUrl) { 
				if (audioUrl) {
					self._doCallback(self.options.onAudioUrlLoaded, audioUrl, text, language);

					if (!self.options.disableAudio) {
						self._player.addToPlaylist(audioUrl);
					}
				}

				self._doCallback(audioUrl ? onSuccess : onFailure, text, language);
			}
		);
	}

	this._autoDetectLanguage = function(text, onSuccess, onFailure) {
		var self = this;

		this.detectLanguage(text, function (language) { 			
			var isValid = self._validateLanguage(language);

			if (isValid) {
				self._doCallback(self.options.onLangDetected, text, language);
			}

			self._doCallback(isValid ? onSuccess : onFailure, language);
		});
	}

	this._validateLanguage = function(language) {
		if (language) {				
			var allowedLanguages = this.options.allowedLanguages;

			for (var i = 0; i < allowedLanguages.length; i++) {
				if (allowedLanguages[i] == language) {
					return true;
				}
			}
		}
		return false;
	};

	this._escapeStringChars = function(text) {
		if (text) {
			text = '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
		}
		return text;
	}
	
}).call(RoboVoice.prototype);

// ---------------------------------------------
window.RoboVoice = RoboVoice;

})()