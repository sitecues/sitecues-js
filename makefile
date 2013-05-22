# Parameters.
name:=sitecues

local-version:=0.0.$(shell date -u +'%Y%m%d%H%M%S')-LOCAL-$(shell echo ${USER} | tr '[:lower:]' '[:upper:]')
version=$(local-version)

clean-deps=false
dev=false

package-basedir:=target/package
package-name:=$(name)-js-$(version)
package-file-name:=$(package-name).tgz
package-dir:=$(package-basedir)/$(package-name)

# Production files (combine all modules into one).
files=\
	target/source/js/core.js \
	source/js/conf.js \
	source/js/conf/localstorage.js \
	source/js/conf/import.js \
	source/js/conf/remote.js \
	source/js/conf/server.js \
	source/js/jquery.js \
	source/js/jquery/color.js \
	source/js/jquery/cookie.js \
	source/js/jquery/transform2d.js \
	source/js/ui.js  \
	source/js/load.js \
	source/js/style.js \
	source/js/util/positioning.js \
	source/js/util/common.js \
	source/js/badge.js \
	source/js/panel.js \
	source/js/zoom.js \
	source/js/keys.js \
	source/js/focus.js \
	source/js/caret.js \
	source/js/caret/view.js \
	source/js/caret/coords.js \
	source/js/caret/classifier.js \
	source/js/cursor.js \
	source/js/highlight-box.js \
	source/js/background-dimmer.js \
	source/js/mouse-highlight.js \
	source/js/mouse-highlight/picker.js \
	source/js/speech.js \
	source/js/speech/azure.js \
	source/js/speech/ivona.js \
	source/js/speech/jplayer.js \
	source/js/invert.js \
	source/js/cursor/canvas.js \
	source/js/cursor/style.js \
	source/js/cursor/element.js \
	# source/js/toolbar.js \

https=off
lint=false
min=true
port=8000
uglifyjs-args=

ifeq ($(clean-deps), true)
	_clean_deps:=deps-clean
else
	_clean_deps:=.no-clean-deps
endif

# Developement files (load modules separately).
ifeq ($(dev), true)
	files=target/source/js/core.js source/js/use.js source/js/debug.js
endif

ifeq ($(https), on)
	port:=80
endif

ifeq ($(lint), true)
	_build_lint_dep:=lint
else
	_build_lint_dep:=.no-lint-on-build
endif

ifeq ($(min), false)
	uglifyjs-args+=-b
endif

# HIDDEN TARGET: .no-lint-on-build
# Alternate target when not linting during build.
.no-lint-on-build:
	@echo "Linting disabled on build."

.no-clean-deps:
	@echo "Cleaning dependencies disabled."

# TARGET: all
# Run all targets.
all: clean deps build

# TARGET: build
# Build the compressed file and, optionally, run gjslint.
build: $(_build_lint_dep)
	@echo "Building started."
	@mkdir -p target/source/js
	@sed 's%0.0.0-UNVERSIONED%'$(version)'%g' source/js/core.js > target/source/js/core.js
	@mkdir -p target/compile/js
	@uglifyjs $(uglifyjs-args) -o target/compile/js/equinox.js --source-map target/compile/js/equinox.js.map --source-map-url /equinox.js.map $(files)
	@echo "Building completed."

# TARGET: package
# Package up the files into a deployable bundle, and create a manifest for local file deployment
package: build
ifeq ($(dev), true)
	$(error Unable to package a development build)
endif
	@echo "Packaging started."
	@mkdir -p $(package-dir)
	@echo $(version) > $(package-dir)/VERSION.TXT
	@cp -R target/compile/* $(package-dir)
	@cp -R source/css $(package-dir)
	@cp -R source/images $(package-dir)
	@tar -C $(package-basedir) -zcf target/$(package-file-name) $(package-name)
	@rm -f target/manifest.txt
	@(cd $(package-dir) ; for FILE in `find * -type f | sort` ; do \
		echo "$(CURDIR)/$$FILE\t$$FILE" >> ../../manifest.txt ; \
	done)
	@echo "Packaging completed."

# TARGET: clean
# Clean the target directory.
clean:
	@echo "Cleaning started."
	@rm -fr target
	@echo "Cleaning completed."

# TARGET: deps
# Set up the dependencies.
deps: $(_clean_deps)
	@echo "Dependency setup started."
	@npm install
	@echo "Dependency setup completed."

deps-clean:
	@echo "Cleaning dependencies started."
	@rm -fr node_modules
	@echo "Cleaning dependencies completed."

# TARGET: lint
# 	Run gjslint on the JavaScript source.
lint:
	@echo "Linting started."
	@gjslint --nojsdoc -r source/js
	@echo "Linting completed."

# TARGET: run
# Run the web server, giving access to the library and test pages.
# Additionally, copy in core config files, if they do not exist.
run:
	@echo "Running."
	@./binary/web $(port) $(https)
