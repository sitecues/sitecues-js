define(
    [
        'intern!tdd',
        'intern/chai!assert',
        'target/common/compile/js/sitecues'
    ],
    function (tdd, assert) {
        with (tdd) {
            suite('colors', function () {

                test('#randomColorIsValid', function () {
                    var color = sitecues.qa.getRandomColor(), i, len = color.length,
                        validHex = [
                            '0', '1', '2', '3', '4',
                            '5', '6', '7', '8', '9',
                            'A', 'B', 'C', 'D', 'E', 'F'
                        ];
                    assert.lengthOf(color, 7);
                    assert.strictEqual(color[0], '#');
                    for (i = 1; i < len; i = i + 1) {
                        assert.include(validHex, color[i]);
                    }
                });
                test('#uniqueColorsAreNeverTheSame', function () {
                    var color, i, memory = [];

                    for (i = 0; i < 1000; i = i + 1) {
                        color = sitecues.qa.getUniqueColor();
                        assert.notInclude(memory, color);
                        memory.push();
                    }
                });

            });
        }
    }
);
