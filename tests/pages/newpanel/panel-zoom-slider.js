function refreshZoomSlider(slowly) {
  var value = settings.zoomLevel;
  var sliderElement = document.getElementById("scp-zoom-slider-bar");
  var minZoom = parseFloat(sliderElement.getAttribute("aria-valuemin"));
  var maxZoom  = parseFloat(sliderElement.getAttribute("aria-valuemax"));
  var thumbElement = document.getElementById(sliderElement.getAttribute("data-thumb-mover"));
  var percent = state.isRealSettings ? (value - minZoom) / (maxZoom - minZoom) : .67;
  var sliderWidth = state.isLarge ? LARGE_SLIDER_WIDTH : SMALL_SLIDER_WIDTH;
  var offset = (percent * sliderWidth) + (state.isLarge? 29 : 0);
  thumbElement.setAttribute('class', slowly ? 'scp-zoom-slider-slow' : '');
  thumbElement.style.transform = thumbElement.style.webkitTransform  = "translate(" + offset + "px)";

  document.getElementById("scp-zoom-value").firstChild.data = value <= 1 ? 'Off': value + 'x';
}

function setCleanedZoomValue(value) {
  // Turn off fake settings. This happens if + or - is pressed before first expansion
  state.isRealSettings = true;

  var sliderElement = document.getElementById("scp-zoom-slider-bar");
  var minZoom = parseFloat(sliderElement.getAttribute("aria-valuemin"));
  value = Math.max(value, minZoom);
  var maxZoom  = parseFloat(sliderElement.getAttribute("aria-valuemax"));
  value = Math.min(value, maxZoom);
  value = value.toFixed(1);
  sliderElement.setAttribute("aria-valuenow", value.toString());
  settings.zoomLevel = value;
}

function moveSlider(delta) {
  var sliderElement = document.getElementById("scp-zoom-slider-bar");
  var ZOOM_INCREMENT = .1;
  var currentValue = parseFloat(sliderElement.getAttribute("aria-valuenow"));
  var newValue = currentValue + delta * ZOOM_INCREMENT;
  setCleanedZoomValue(newValue);
  refreshZoomSlider(state.isLarge); // Don't support other sliders yet
}

function sliderMouseDown(evt) {
  if (!state.isReady) {
    return;
  }
  window.addEventListener('mousemove', sliderMouseCapture, false);
  window.addEventListener('mouseup', clearSliderMouseCapture, false);
  sliderMouseCapture(evt);
}

function sliderMouseCapture(evt) {
  var sliderElement = document.getElementById("scp-zoom-slider-bar");
  var minZoom = parseFloat(sliderElement.getAttribute("aria-valuemin"));
  var maxZoom  = parseFloat(sliderElement.getAttribute("aria-valuemax"));
  var sliderThumbRect = document.getElementById('scp-zoom-slider-thumb').getBoundingClientRect();
  var sliderRect = document.getElementById('scp-zoom-slider-bar').getBoundingClientRect();
  var panelLeft = getSVG().getBoundingClientRect().left;
  var FIREFOX_SLIDER_OFFSET = 83; // Hardcoded because of https://bugzilla.mozilla.org/show_bug.cgi?id=479058
  var sliderLeft = isWebkit() ? sliderRect.left + sliderThumbRect.width / 2 : panelLeft + FIREFOX_SLIDER_OFFSET;
  var sliderWidth = sliderRect.width - sliderThumbRect.width;
  var newPercent = (evt.clientX - sliderLeft) / sliderWidth;
  var newValue = (newPercent * (maxZoom - minZoom)) + minZoom;
  setCleanedZoomValue(newValue);
  clearTimeout(refreshZoomSliderTimerId);
  refreshZoomSliderTimerId = setTimeout(refreshZoomSlider, 5);
  evt.preventDefault();
}

function clearSliderMouseCapture() {
  window.removeEventListener('mousemove', sliderMouseCapture);
}

function zoomButtonMouseDown(evt) {
  var target = evt.target.correspondingUseElement || evt.target;
  var delta = (target.id === 'scp-small-A') ? -1 : 1;
  var sliderElement = document.getElementById('scp-zoom-slider-bar');
  function bumpSlider() {
    moveSlider(delta);
  }

  bumpSlider();
  zoomButtonTimerId = setInterval(bumpSlider, 150);
}

function zoomButtonMouseUp() {
  clearInterval(zoomButtonTimerId);
}

function zoomButtonMouseOut() {
  clearInterval(zoomButtonTimerId);
}


