# Parameters.
name:=sitecues
username:=$(shell ./tools/build/username.sh -c)
local-version:=0.0.$(shell date -u +'%Y%m%d%H%M%S')-LOCAL-$(username)
version=$(local-version)

# Set vagrant-dependent variables
is-vagrant:=$(shell ./tools/build/is_vagrant.sh)
ifeq ($(is-vagrant), 1)
	service-root:=/home/vagrant
	phantomjs-service-root:=/home/vagrant
else
	service-root:=.
	phantomjs-service-root:=../..
endif

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
  target/source/js/core.js \
  source/js/jquery.js \
  source/js/custom.js \
  source/js/custom-scripts/custom_a-0000ee0c_EQ-1508.js \
  source/js/custom-scripts/custom_a-0000ee0c_EQ-1492.js \
  source/js/custom-scripts/custom-a-f35c8b26_EQ-1506.js \
  source/js/load.js \
  source/js/conf/user/manager.js \
  source/js/conf/user/server.js \
  source/js/conf/user/provided.js \
  source/js/conf/user.js \
  source/js/conf/site.js \
  source/js/conf.js \
  source/js/geo.js \
  source/js/platform.js \
  source/js/jquery/color.js \
  source/js/jquery/cookie.js \
  source/js/jquery/transform2d.js \
  source/js/jquery/style.js \
  source/js/jquery/resize.js \
  source/js/util/close-button.js \
  source/js/ui.js \
  source/js/style.js \
  source/js/util/common.js \
  source/js/util/positioning.js \
  source/js/html-build.js \
  source/js/speech-builder.js \
  source/js/speech.js \
  source/js/zoom.js \
  source/js/slider.js \
  source/js/panel.js \
  source/js/badge.js \
  source/js/fixFixedBadgeAndPanel.js \
  source/js/focus.js \
  source/js/mouse-highlight/roles.js \
  source/js/mouse-highlight/picker.js \
  source/js/mouse-highlight.js \
  source/js/keys.js \
  source/js/background-dimmer.js \
  source/js/cursor/images/win.js \
  source/js/cursor/images/mac.js \
  source/js/cursor/images/manager.js \
  source/js/cursor/custom.js \
  source/js/cursor.js \
  source/js/hlb/designer.js \
  source/js/hlb/event-handlers.js \
  source/js/highlight-box.js \
  source/js/hpan.js \
  source/js/iframe-modal.js \
  source/js/invert.js \
  source/js/util/template.js \
  source/js/toolbar/bootstrap-dropdown.js \
  source/js/toolbar/dropdown.js \
  source/js/toolbar/messenger.js \
  source/js/toolbar/resizer.js \
  source/js/toolbar.js \
  source/js/ui-manager.js \
  source/js/status.js \
  source/js/sitepicker.js \

https=off
prod=off
ports-env-file:=./var/data/testsite/ports.txt
lint=true
min=true
port=8000
uglifyjs-args=

testsite-timeout:=30000
phantomjs-timeout:=30000

default-test-run-id:=$(username)-$(shell ./binary/uuid)
test-run-id=$(default-test-run-id)

common-macchiato-options:=-Dbrowser.name.prefix=$(test-run-id)
testunit-mocha-options:=-c
smoke-macchiato-options:=-Dphantomjs.run.cwd=$(phantomjs-service-root)

ifeq ($(clean-deps), true)
	_clean_deps:=deps-clean
else
	_clean_deps:=.no-clean-deps
endif

# Developement files (load modules separately).
ifeq ($(dev), true)
	files=\
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
	min-label:=" \(files were not minified\)"
else
    uglifyjs-args+=-m
	min-label:=
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
	@uglifyjs $(uglifyjs-args) -o target/compile/js/sitecues.js --source-map target/compile/js/sitecues.js.map --source-map-url sitecues.js.map $(files)
	@mkdir -p target/etc/js
	@cp -r source/js/_config target/etc/js
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F target/etc ; done)
	@echo "Creating compressed (gzipped) JavaScript files."
	@(cd target/compile/js ; for FILE in *.js ; do \
		gzip -c $$FILE > $$FILE.gz ; \
	done)
	@echo "Building completed."
ifneq ($(dev), true)
	@echo "===== File sizes$(min-label):"
	@(cd target/compile/js ; \
	for FILE in `ls *.js *.js.gz | sort` ; do \
		printf "=====   %-16s $$(ls -lh $$FILE | awk '{print($$5);}')\n" $$FILE ; \
	done)
endif

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
	@./binary/_web start --timeout $(testsite-timeout) --root $(service-root) -- $(port) $(https) $(prod) $(ports-env-file)

# TARGET: stop-testsite
# Run the web server as a service, giving access to the library and test pages.
stop-testsite:
	@./binary/_web stop --root $(service-root)

# TARGET: test-all
# Run all tests.
test-all: test-unit test-smoke

# TARGET: test-smoke
# Run the smoke tests.
test-smoke:
	@(make --no-print-directory start-testsite prod=on)
	@echo "TEST RUN ID: $(test-run-id)"
	@cd tests/smoke ; ../../node_modules/.bin/macchiato `cat ../../$(ports-env-file)` $(common-macchiato-options) $(smoke-macchiato-options)

# TARGET: test-unit
# Run the unit tests.
test-unit:
	@echo "TEST RUN ID: $(test-run-id)"
	@cd ./tests/unit ; ../../node_modules/.bin/mocha $(testunit-mocha-options)

# TARGET: stop-all-services
# Stop all known services.
stop-all-services: stop-testsite
