define(
    [],
    function () {
        function hasEvent(name) {
            return ('on' + name) in window;
        }

        return {
            pointerEvents     : hasEvent('pointerdown'),
            touchEvents       : hasEvent('touchstart'),
            lightEvents       : hasEvent('devicelight'),
            proximityEvents   : hasEvent('deviceproximity'),
            motionEvents      : hasEvent('devicemotion'),
            orientationEvents : hasEvent('deviceorientation'),
            batteryApi        : typeof navigator.getBattery === 'function',
            vibrateApi        : typeof navigator.vibrate === 'function',
            ttsApi            : typeof speechSynthesis === 'object' && Boolean(speechSynthesis),
            transcribeApi     : typeof SpeechRecognition === 'function'
        };
    }
);
