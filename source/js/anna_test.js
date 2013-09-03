// #1 - simple example
simple = {};
simple.foo = function () {
  return 'done';
};

// #2 - medium example: anonymous function within its scope.
(function () {
    // this becomes public due to the reference exposure in the return below
    var boo = function () {
        return 'done 2';
    };

    exports.medium = boo; // exports foo;

}());

// #3 - real exapmple: module wrapped in sitecues loader functions.
sitecues.def('style', function (style, callback, log) {
  sitecues.use('', function() {
    this.doo = function() {
      return 'done 3';
    };
    exports.real = this.doo;
  })
});