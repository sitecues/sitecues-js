// Dark theme support
// Ensure dependencies built
define(['dark-theme/img-classifier', 'dark-theme/bg-image-classifier', 'dark-theme/inverter'],
  function(imgClassifier, bgImgClassifier, inverter) {
    function init() {
      inverter.init();
    }

    return {
      init: init,
      imgClassifier: imgClassifier,
      bgImgClassifier: bgImgClassifier,
      inverter: inverter
    };
});