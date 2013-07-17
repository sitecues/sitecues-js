# Parameters.
name:=sitecues
username:=$(shell [ -n "$${SUDO_USER}" ] && echo "$${SUDO_USER}" || { [ -n "$${USER}" ] && echo "$${USER}" || { [ -n "$${LOGNAME}" ] && echo "$${LOGNAME}" || echo "UNKNOWN" ; } ; } | tr '[:lower:]' '[:upper:]')

local-version:=0.0.$(shell date -u +'%Y%m%d%H%M%S')-LOCAL-$(username)
version=$(local-version)

# Determine if we need to force a deps refresh
deps-sig:=$(shell $$(which 'md5sum'&> /dev/null && echo 'md5sum' || echo 'md5 -q') ./package.json | awk '{print($$1);}')
deps-sig-file:=./node_modules/.sig
existing-deps-sig:=$(shell if [ -s $(deps-sig-file) ] ; then cat $(deps-sig-file) ; else echo 0 ; fi)
ifneq ($(deps-sig), $(existing-deps-sig))
	_force_deps_refresh=deps-clean deps
else
	_force_deps_refresh=
endif

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
	source/js/load.js \
	source/js/jquery.js \
	source/js/conf/main.js \
	source/js/conf/localstorage.js \
	source/js/conf/import.js \
	source/js/conf/remote.js \
	source/js/conf/server.js \
	source/js/conf.js \
	source/js/jquery/color.js \
	source/js/jquery/cookie.js \
	source/js/jquery/transform2d.js \
	source/js/jquery/style.js \
	source/js/jquery/resize.js \
	source/js/ui.js  \
	source/js/style.js \
	source/js/util/positioning.js \
	source/js/util/common.js \
	source/js/badge.js \
	source/js/zoom.js \
	source/js/slider.js \
	source/js/panel.js \
	source/js/keys.js \
	source/js/focus.js \
	source/js/cursor.js \
	source/js/highlight-box.js \
	source/js/hlb/event-handlers.js \
  source/js/hlb/designer.js \
	source/js/background-dimmer.js \
	source/js/mouse-highlight.js \
	source/js/mouse-highlight/roles.js \
	source/js/mouse-highlight/picker.js \
	source/js/speech.js \
	source/js/speech/azure.js \
	source/js/speech/ivona.js \
	source/js/speech/jplayer.js \
	source/js/invert.js \
	source/js/cursor/style.js \
	source/js/cursor/custom.js \
	source/js/cursor/element.js \
	source/js/cursor/images.js \
	source/js/util/template.js \
	source/js/toolbar/bootstrap-dropdown.js \
	source/js/toolbar/dropdown.js \
	source/js/toolbar/messenger.js \
	source/js/toolbar/resizer.js \
	source/js/toolbar.js \
	source/js/ui-manager.js \

https=off
prod=off
ports-env-file:=./var/data/testsite/ports.txt
lint=true
min=true
port=8000
uglifyjs-args=
testingbot-api-key:=b62a13f4d5cdb0f6c8b9e790ebd1aa8e
testingbot-api-secret:=5fcb13beac07d9d8eff12944dadb5f86

testsite-timeout:=30000
phantomjs-timeout:=30000
testingbot-tunnel-timeout:=240000

default-test-run-id:=$(username)-$(shell ./binary/uuid)
test-run-id=$(default-test-run-id)

common-macchiato-options=-Dbrowser.name.prefix=$(test-run-id)

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
build: $(_force_deps_refresh) $(_build_lint_dep)
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
	@echo $(deps-sig) > $(deps-sig-file)
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
	@./binary/_web start --timeout $(testsite-timeout) --root . -- $(port) $(https) $(prod) $(ports-env-file)

# TARGET: stop-testsite
# Run the web server as a service, giving access to the library and test pages.
stop-testsite:
	@./binary/_web stop

# TARGET: test-all
# Run all tests.
test-all: test-smoke test-unit

# TARGET: test-smoke
# Run the smoke tests.
test-smoke:
	@(make --no-print-directory start-testsite prod=on)
	@(make --no-print-directory start-phantomjs)
	@(cd tests/smoke && echo "TEST RUN ID: $(test-run-id)" && ../../node_modules/.bin/macchiato `cat ../../$(ports-env-file)` $(common-macchiato-options))

# TARGET: test-unit
# Run the unit tests.
test-unit:
	@(make --no-print-directory start-testsite prod=on)
	@(make --no-print-directory start-testingbot-tunnel)
	@(cd tests/unit && echo "TEST RUN ID: $(test-run-id)" && ../../node_modules/.bin/macchiato `cat ../../$(ports-env-file)` $(common-macchiato-options))

# TARGET: start-phantomjs
# Start the PhantomJS service.
start-phantomjs:
	@node_modules/.bin/_phantomjs start --timeout $(phantomjs-timeout) --root . -- --config=phantomjs.json

# TARGET: stop-phantomjs
# Stop the PhantomJS service.
stop-phantomjs:
	@node_modules/.bin/_phantomjs stop

# TARGET: start-testingbot-tunnel
# Start the TestingBot Tunnel service.
start-testingbot-tunnel:
	@node_modules/.bin/_testingbot-tunnel start --timeout $(testingbot-tunnel-timeout) --root . -- $(testingbot-api-key) $(testingbot-api-secret)

# TARGET: stop-testingbot-tunnel
# Stop the TestingBot Tunnel service.
stop-testingbot-tunnel:
	@node_modules/.bin/_testingbot-tunnel stop

# TARGET: stop-all-services
# Stop all known services.
stop-all-services: stop-testsite stop-phantomjs stop-testingbot-tunnel
