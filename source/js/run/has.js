define(
    [],
    function () {
        function hasEvent(name) {
            return ('on' + name) in window;
        }

        // TODO: Remove this when issue is resolved:
        // https://github.com/jshint/jshint/issues/3014
        var speechSynthesis = window.speechSynthesis;

        return {
            pointerEvents     : hasEvent('pointerdown'),
            touchEvents       : hasEvent('touchstart'),
            lightEvents       : hasEvent('devicelight'),
            proximityEvents   : hasEvent('deviceproximity'),
            motionEvents      : hasEvent('devicemotion'),
            orientationEvents : hasEvent('deviceorientation'),
            batteryApi        : typeof navigator.getBattery === 'function',
            vibrateApi        : typeof navigator.vibrate === 'function',
            speechSynthApi    : typeof speechSynthesis === 'object' && Boolean(speechSynthesis),
            speechRecApi      : typeof SpeechRecognition === 'function'
        };
    }
);
