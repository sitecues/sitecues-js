const babel    = require('babel-core'),
      fs       = require('fs'),
      path     = require('path'),
      corePath = '../sitecues-core/lib/js/';

const readFile = (fileName) => {
    return new Promise((resolve, reject) => {
        const filePath = path.resolve(corePath, fileName);
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                reject(err);
                return;
            }
            console.log(fileName + ' has been read');
            resolve(content);
        });
    });
};

readFile('metric.js').then(content => {
    fs.writeFileSync('./metric_transpile.js', babel.transform(content, {
        plugins : ['transform-es2015-modules-amd'],
        presets : ['es2015']
    }).code);
});
