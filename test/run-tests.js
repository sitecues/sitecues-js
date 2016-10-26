process.on('unhandledRejection', (err) => {
    throw err;
});

const { exec }  = require('child_process');
const babel     = require('babel-core');
const fs        = require('fs');
const fsAtomic  = require('fs-atomic');
const path      = require('path');
const del       = require('del');
const corePath  = '../sitecues-core/lib/js/';
const buildPath = path.resolve('test/mini-core');

const readCoreFile = (fileName, pathComponents) => {
    return new Promise((resolve, reject) => {
        const filePath = path.resolve(corePath, ...pathComponents, fileName);
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(content);
        });
    });
};

const transpileCoreModule = (pathComponents) => {
    const fileName = pathComponents.pop() + '.js';
    return constructModulePath(pathComponents)
        .then(() => {
            return readCoreFile(fileName, pathComponents);
        })
        .then(module => {
            fs.writeFileSync(path.resolve(buildPath, ...pathComponents, fileName), babel.transform(module, {
                plugins : [
                    'add-module-exports',
                    'transform-es2015-modules-amd'
                ],
                presets : ['es2015']
            }).code);
        });
};

const constructModulePath = (pathComponents) => {
    return fsAtomic.mkdir(path.resolve(buildPath, ...pathComponents));
};

const cleanBuildDirectory = (dirPath) => {
    return del(dirPath, {
        force : true
    });
};

const buildCoreModules = () => {
    return cleanBuildDirectory(buildPath).then(() => {
        return Promise.all([
            ['native-global'],
            ['hidden-iframe'],
            ['app-url'],
            ['dom-event'],
            ['url'],
            ['meta'],
            ['uuid'],
            ['conf', 'user'],
            ['conf', 'site'],
            ['storage', 'permanent'],
            ['storage', 'global'],
            ['storage', 'local']
        ].map(transpileCoreModule))
    });
};

buildCoreModules().then(() => {
    exec('./test/run.sh');
});
