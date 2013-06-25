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
# Note: 'log4javascript_uncompressed.js' will be swapped for a smaller version at a later date
files=\
	source/js/logging/log4javascript_uncompressed.js \
	source/js/logging/init_logger.js \
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
	source/js/jquery/style.js \
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
	source/js/hlb/event-handlers.js \
	source/js/background-dimmer.js \
	source/js/mouse-highlight.js \
	source/js/mouse-highlight/roles.js \
	source/js/mouse-highlight/picker.js \
	source/js/speech.js \
	source/js/speech/azure.js \
	source/js/speech/ivona.js \
	source/js/speech/jplayer.js \
	source/js/invert.js \
	source/js/cursor/canvas.js \
	source/js/cursor/style.js \
	source/js/cursor/custom.js \
	source/js/cursor/images.js \
	source/js/util/template.js \
	source/js/util/hammer.js \
	source/js/toolbar/bootstrap-dropdown.js \
	source/js/toolbar/dropdown.js \
	source/js/toolbar/slider.js \
	source/js/toolbar/messenger.js \
	source/js/toolbar/resizer.js \
	source/js/toolbar.js \

https=off
prod=off
ports-file:=$(shell pwd)/var/data/testsite/ports.txt
lint=true
min=true
port=8000
uglifyjs-args=
testingbot-api-key:=1b304798f3713751275ed2fff1a397d0
testingbot-api-secret:=e93cb09b9d16bbc3bd1a38dc7ce93737

ifeq ($(clean-deps), true)
	_clean_deps:=deps-clean
else
	_clean_deps:=.no-clean-deps
endif

# Developement files (load modules separately).
ifeq ($(dev), true)
	files=\
		source/js/logging/log4javascript_uncompressed.js \
		source/js/logging/init_logger.js \
		source/js/logging/init_logger_dev.js \
		target/source/js/core.js \
		source/js/use.js source/js/debug.js
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
	@mkdir -p target/etc/js
	@cp -r source/js/.cfg target/etc/js
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F target/etc ; done)
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
	@mkdir -p node_modules
	@npm install
	@echo "Dependency setup completed."

deps-clean:
	@echo "Cleaning dependencies started."
	@rm -fr node_modules
	@echo "Cleaning dependencies completed."

# TARGET: lint
# Run gjslint on the JavaScript source.
#@gjslint --nojsdoc -r source/js
lint:
	@echo "Linting started."
	@lenient-lint --beep --error_trace --multiprocess --nojsdoc -r source/js --summary --time --unix_mode
	@echo "Linting completed."

# TARGET: run
# Run the web server, giving access to the library and test pages.
run:
	@./binary/web.js $(port) $(https) $(prod)

# TARGET: start-testsite
# Run the web server as a service, giving access to the library and test pages.
start-testsite:
	@./binary/_web start $(port) $(https) $(prod) $(ports-file)

# TARGET: stop-testsite
# Run the web server as a service, giving access to the library and test pages.
stop-testsite:
	@./binary/_web stop

# TARGET: test-all
# Run all tests.
test-all: test-smoke

# TARGET: test-all
# Run all tests.
test-all: test-smoke test-unit

# TARGET: test-smoke
# Run the smoke tests.
test-smoke:
	@(make --no-print-directory start-testsite prod=on)
	@(cd tests/smoke && ../../node_modules/.bin/_phantomjs start --config=phantomjs.json && ../../node_modules/.bin/macchiato `cat $(ports-file)`)

# TARGET: test-unit
# Run the unit tests.
test-unit:
	@(make --no-print-directory start-testsite prod=on)
	@(cd tests/unit && ../../node_modules/.bin/_testingbot-tunnel start $(testingbot-api-key) $(testingbot-api-secret) && ../../node_modules/.bin/macchiato `cat $(ports-file)`)

# TARGET: stop-phantomjs
# Stop the PhantomJS service.
stop-phantomjs:
	@node_modules/.bin/_phantomjs stop

# TARGET: stop-testingbot-tunnel
# Stop the TestingBot Tunnel service.
stop-testingbot-tunnel:
	@node_modules/.bin/_testingbot-tunnel stop
