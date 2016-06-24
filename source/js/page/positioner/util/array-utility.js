define([], function () {
  // Return an array with the members of arr1 that aren't in arr2, and the members of arr2 that aren't in arr1
  // NOTE: if elements aren't unique in an array, they will be repeated in the difference
  function symmetricDifference(arr1, arr2) {
    var difference,
      array1 = Array.prototype.slice.call(arr1, 0),
      array2 = Array.prototype.slice.call(arr2, 0);
    
    if (array1.length) {
      difference = array2.filter(function (member) {
        if (typeof member !== 'undefined') {
          var index = array1.indexOf(member);
          if (index !== -1) {
            array1.splice(index, 1);
            return false;
          }
          return true;
        }
      });
      difference = difference.concat(array1);
    }
    else {
      difference = array2;
    }
    
    return difference;
  }

  // Takes any number of arrays and returns the union of all sets, i.e. an array with the unique members of each array
  function union() {
    var
      set        = new Set(),
      arrays     = Array.prototype.slice.call(arguments, 0),
      arrayCount = arrays.length;

    for (var i = 0; i < arrayCount; i++) {
      var
        array     = arrays[i],
        arraySize = array.length;
      for (var j = 0; j < arraySize; j++) {
        set.add(array[j]);
      }
    }

    return fromSet(set);
  }

  // Returns the an array with elements that are in all of the passed arrays
  function intersection() {
    var
      arrays = arguments,
      i      = arrays.length;
    return Array.prototype.filter.call(arrays[0], function (elem) {
      while (--i) {
        var arr = arrays[i];
        if (arr.indexOf(elem) === -1) {
          return false;
        }
      }
      return true;
    });
  }

  // Only add element if it isn't currently in the array. Return original array
  function addUnique(arr, element) {
    if (arr.indexOf(element) === -1) {
      arr.push(element);
    }
    return arr;
  }

  // Returns a new array with only the unique elements in @arr
  function unique(original) {
    var
      results = [],
      i       = original.length;
    while (i--) {
      if (results.indexOf(original[i]) === -1) {
        results.unshift(original[i]);
      }
    }
    return results;
  }

  // Removes all elements matching @element from the @array, returns a new array
  function remove(array, element) {
    var index;
    do {
      index = array.indexOf(element);
      if (index !== -1) {
        array.splice(index, 1);
      }
    } while (index !== -1);
    return array;
  }

  function fromSet(set) {
    var arr = [];
    set.forEach(function (member) {
      arr.push(member);
    });
    return arr;
  }

  return {
    remove: remove,
    addUnique: addUnique,
    unique: unique,
    symmetricDifference: symmetricDifference,
    union: union,
    intersection: intersection,
    fromSet: fromSet
  };
});