/**
 * element-map
 *
 * Stores any meta data you want with an element
 * TODO perhaps traitcache should use this -- in some ways they are very similar (note that traitcache uses $.data);
 * TODO can we just set properties directly in the same way $.data() does? E.g. element.scdata.computedStyle = {}
 */
define([], function () {

  'use strict';

  var map = new WeakMap();

  function setField(element, fields, values) {
    var dataCache = getData(element);
    if (!Array.isArray(fields)) {
      fields = [fields];
      values = [values];
    }
    var len = fields.length;
    for (var i = 0; i < len; i++) {
      dataCache[fields[i]] = values[i];
    }
    map.set(element, dataCache);
  }

  function saveComputedStyle(element, style) {
    setField(element, ['computedStyle'], [style]);
  }

  function clearComputedStyle(elements) {
    if (Array.isArray(elements)) {
      var len = elements.length;
      for (var i = 0; i < len; i++) {
        var element = elements[i];
        if (element) {
          flushField(element, 'computedStyle');
        }
      }
    }
    else {
      flushField(elements, 'computedStyle');
    }
  }

  function getComputedStyle(element) {
    var style = getField(element, 'computedStyle');
    if (style) {
      return style;
    }
    style = window.getComputedStyle(element);
    saveComputedStyle(element, style);
    return style;
  }

  function refreshComputedStyle(element) {
    clearComputedStyle(element);
    return getComputedStyle(element);
  }

  function flushField(element, fields) {
    var
      values    = [],
      dataCache = getData(element);

    if (!Array.isArray(fields)) {
      fields = [fields];
    }

    var i = fields.length;
    while (i--) {
      var field = fields[i];
      values.push(dataCache[field]);
      delete dataCache[field];
    }

    map.set(element, dataCache);
    return values.length === 1 ? values[0] : values;
  }

  function getField(element, field) {
    return getData(element)[field];
  }

  function addToField(element, field, value) {
    var data = getField(element, field) || [];
    data.push(value);
    setField(element, [field], [data]);
  }

  function getData(element) {
    return map.get(element) || {};
  }

  return {
    setField: setField,
    addToField: addToField,
    flushField: flushField,
    getField: getField,
    clearComputedStyle: clearComputedStyle,
    refreshComputedStyle: refreshComputedStyle,
    getComputedStyle: getComputedStyle
  };
});