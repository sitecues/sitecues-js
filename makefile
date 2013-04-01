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
		source/script/conf/localstorage.js\
		source/script/conf/import.js\
		source/script/conf/remote.js\
		source/script/conf/server.js\
		source/script/jquery.js\
		source/script/jquery/color.js\
		source/script/jquery/transform2d.js\
		source/script/ui.js\
		source/script/load.js\
		source/script/style.js\
		source/script/util.js\
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
		source/script/highlight-box.js\
		source/script/background-dimmer.js\
		source/script/mouse-highlight.js\
		source/script/mouse-highlight/picker.js\
		source/script/speech.js\
		source/script/speech/azure.js

	@mkdir -p target/style
	@cp source/style/default.css target/style/default.css