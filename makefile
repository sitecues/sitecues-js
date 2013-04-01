https=off
port=8000

all:
    @npm install

lint:
    @gjslint --nojsdoc -r source/script

build: lint start

build-no-lint: start

run:
    @./binary/web $(port) $(https)

start:
    @mkdir -p target/script
    @uglifyjs -o target/script/equinox.js --source-map target/script/equinox.js.map --source-map-url /equinox.js.map \
        source/script/badge.js \
        source/script/caret.js \
        source/script/caret/classifier.js \
        source/script/caret/coords.js \
        source/script/caret/view.js \
        source/script/conf.js \
        source/script/conf/import.js \
        source/script/conf/localstorage.js \
        source/script/conf/remote.js \
        source/script/cursor.js \
        source/script/eqnx.js \
        source/script/focus.js \
        source/script/geo.js \
        source/script/jquery.js \
        source/script/keys.js \
        source/script/load.js \
        source/script/panel.js \
        source/script/speech.js \
        source/script/speech/azure.js \
        source/script/style.js \
        source/script/ui.js \
        source/script/use.js \
        source/script/util.js \
        source/script/zoom.js