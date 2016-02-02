// Inverted theme support -- dark theme on a light website
// Ensure dependencies built
define(['inverse-theme/img-classifier', 'inverse-theme/bg-image-classifier', 'inverse-theme/inverter'],
  function(imgClassifier, bgImgClassifier, inverter) {
    var isInitialized;

    function init() {
      if (!isInitialized) {
        inverter.init();
        isInitialized = true;
      }
    }

    return {
      init: init,
      imgClassifier: imgClassifier,
      bgImgClassifier: bgImgClassifier,
      inverter: inverter
    };
});