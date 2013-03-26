port=8000
https=off

all:
	@npm install

run:
	@./binary/web $(port) $(https)

build:
	@mkdir -p target/script
	@uglifyjs -o target/script/equinox.js --source-map target/script/equinox.js.map --source-map-url /equinox.js.map\
		source/script/eqnx.js\
		source/script/conf.js\
		source/script/conf/import.js\
		source/script/conf/localstorage.js\
		source/script/jquery.js\
		source/script/ui.js\
		source/script/geo.js\
		source/script/util.js\
		source/script/load.js\
		source/script/style.js\
		source/script/badge.js\
		source/script/panel.js\
		source/script/zoom.js\
		source/script/keys.js\
		source/script/focus.js\
		source/script/caret.js\
		source/script/caret/view.js\
		source/script/caret/coords.js\
		source/script/caret/classifier.js\
		source/script/cursor.js\
		source/script/player.js