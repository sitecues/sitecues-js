# Parameters.
dev=false
https=off
min=true
uglifyjs_args=
port=8000
lint=false

# Production files (combine all modules into one).
files=\
	source/script/eqnx.js \
	source/script/conf.js\
	source/script/conf/localstorage.js \
	source/script/conf/import.js \
	source/script/conf/remote.js \
	source/script/conf/server.js \
	source/script/jquery.js \
	source/script/jquery/color.js \
	source/script/jquery/transform2d.js \
	source/script/ui.js  \
	source/script/load.js \
	source/script/style.js \
	source/script/util.js \
	source/script/badge.js \
	source/script/panel.js \
	source/script/zoom.js \
	source/script/keys.js \
	source/script/focus.js \
	source/script/caret.js \
	source/script/caret/view.js \
	source/script/caret/coords.js \
	source/script/caret/classifier.js \
	source/script/cursor.js \
	source/script/highlight-box.js \
	source/script/background-dimmer.js \
	source/script/mouse-highlight.js \
	source/script/mouse-highlight/picker.js \
	source/script/speech.js \
	source/script/speech/azure.js

# Developement files (load modules separately).
ifeq ($(dev), true)
files=source/script/eqnx.js source/script/use.js
endif

# TARGET: all
# 	Run all targets.
all:
	@npm install

# TARGET: build
# 	Build the compressed file and, optionally, run gjslint.
ifeq ($(lint), true)
_build_lint_dep:=lint
else
_build_lint_dep:=.no-lint-on-build
endif

ifeq ($(min), false)
uglifyjs_args+=-b
endif

build: $(_build_lint_dep)
	@mkdir -p target/script
	@uglifyjs $(uglifyjs_args) -o target/script/equinox.js --source-map target/script/equinox.js.map --source-map-url /equinox.js.map $(files)
	@mkdir -p target/style
	@cp source/style/default.css target/style/default.css

# TARGET: lint
# 	Run gjslint on the JavaScript source.
lint:
	@gjslint --nojsdoc -r source/script

# HIDDEN TARGET: .no-lint-on-build
# 	Alternate target when not linting during build.
.no-lint-on-build:
	@echo "Linting disabled on build!"

# TARGET: clean
# 	Clean the target directory.
clean:
	@rm -fr target

# TARGET: run
# 	Run the web server, giving access to the library and test pages.
ifeq ($(https), on)
port:=80
endif

run:
	@echo "Running."
	@./binary/web $(port) $(https)

