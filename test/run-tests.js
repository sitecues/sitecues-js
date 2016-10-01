const { exec }  = require('child_process');
const babel     = require('babel-core');
const fs        = require('fs');
const fsAtomic  = require('fs-atomic');
const path      = require('path');
const del       = require('del');
const corePath  = '../sitecues-core/lib/js/';
const buildPath = path.resolve('test/mini-core');

const readCoreFile = (fileName) => {
    return new Promise((resolve, reject) => {
        const filePath = path.resolve(corePath, fileName);
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(content);
        });
    });
};

const transpileCoreModule = (fileName) => {
    return readCoreFile(fileName).then(module => {
        fs.writeFileSync(path.resolve(buildPath, fileName), babel.transform(module, {
            plugins : [
                'add-module-exports',
                'transform-es2015-modules-amd'
            ],
            presets : ['es2015']
        }).code);
    });
};

const createEmptyDirectory = (dirPath) => {
    return del(dirPath, {
        force : true
    }).then(() => {
        return fsAtomic.mkdir(dirPath);
    });
};

const buildCoreModules = () => {
    return createEmptyDirectory(buildPath).then(() => {
        return Promise.all([
            'native-functions.js',
            'iframe-factory.js'
        ].map(transpileCoreModule))
    });
};

buildCoreModules().then(() => {
    exec('./test/run.sh');
});
