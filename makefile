################################################################################
# sitecues JavaScript Library Main Makefile
################################################################################

################################################################################
# DEFAULT TARGET: all
# 	(To keep this target as the default target, this target must be
#	 declared before all other targets).
# 	Clean the target directory, update Node.js dependencies, and build the
#	JavaScript library.
################################################################################
all: debug

################################################################################
# Command line options.
################################################################################

# If true, clean and update the Node.js package dependencies.
clean-deps=false

# Whether or not to enable HTTPS on the test server.
https=off

# Whether or not to lint the codebase before the build.
lint=true

# Node.js express test server HTTP port.
port=8000

# Whether or not to run the test server in prod-only mode, in which source
# file locations will not be checked for async module loads.
prod=off

# Whether Zepto can be used (a download size improvement over jQuery for IE >= 10, Chrome, Firefox, Safari)
zepto=true

# Whether sourcemaps should be build
sourcemaps=true

# The build version.
export version=$(default-version)

# jshint path
jshint=$(shell npm ls -p jshint)/../.bin/jshint

# target path
export build-basedir=target
export build-dir=$(build-basedir)/common
export resource-dir=$(build-dir)/$(version)

# cleancss path
cleancss=$(shell npm ls -p --depth=0 clean-css)/bin/cleancss

# html-minifier command used for SVG -- do not remove quotes around attributes in the SVG
cleansvg=$(shell npm ls -p --depth=0 html-minifier)/cli.js --remove-comments --collapse-whitespace

################################################################################
# Tools
################################################################################
export md5sum:=$(shell which 'md5sum' > /dev/null 2>&1 && echo 'md5sum' || echo 'md5 -q')
export rmd5=$(shell echo "$$(hostname)$$(date +'%s%N')" | $(md5sum) | cut -f 1 -d ' ')
export to-upper=tr '[:lower:]' '[:upper:]'

################################################################################
# Settings/constants.
################################################################################

# The name of the project.
export product-name=sitecues

# The name of the user running this build.
export username:=$(shell ./tools/build/username.sh -c)

# The default version, used in absence of a supplied version.
default-version:=$(shell date -u +'%Y%m%d%H%M%S')-LOCAL-$(username)

# The file generated by the Node.js test server and used by the SWDDA library
# to determine what ports should be used in URL generation.
ports-env-file:=./var/data/testsite/ports.txt

# Test server start-up timeout.
testsite-timeout:=30000

# The default test run ID
export default-test-run-rmd5:=$(rmd5)
default-test-run-id=$(username)-$(default-test-run-rmd5)
export test-run-id=$(default-test-run-id)

# Options common to all Macchiato test runs.
export common-macchiato-options:=-Dbrowser.name.prefix=$(test-run-id)

# Mocha unit test command line options.
export testunit-mocha-options:=-c

# Macchiato smoke test command line options.
export smoke-macchiato-options:=-Dphantomjs.run.cwd=$(phantomjs-service-root)

################################################################################
# Processed and conditional settings.
################################################################################

# If the 'clean-deps' option is 'true', set the 'deps-clean' target as a
# dependency of 'deps'. Otherwise, print a message stating that the
# dependencies will not be cleaned before the update.
ifeq ($(clean-deps), true)
	_clean_deps:=deps-clean
else
	_clean_deps:=.no-clean-deps
endif

# If the 'https' option is 'on', set the http port to 80.
ifeq ($(https), on)
	port:=80
endif

# If the 'list' option is 'true', set the 'lint' target as a
# dependency of 'build'. Otherwise, print a message stating that the
# linting is disabled.
ifeq ($(lint), true)
	_build_lint_dep:=lint
	_build_lint_debug_dep:=lint-debug
else
	_build_lint_dep:=.no-lint-on-build
	_build_lint_debug_dep:=.no-lint-on-build
endif

################################################################################
# Determine if we need to force a deps update.
################################################################################

# Existing package.json checksum.
node-package-checksum:=$(shell $(md5sum) ./package.json | cut -f 1 -d ' ')

# File containing the checksum during the last dependecy update.
node-package-checksum-file:=./node_modules/.node-package-checksum

# The checksum during the last dependecy update.
existing-node-package-checksum:=$(shell [ -s $(node-package-checksum-file) ] && cat $(node-package-checksum-file) || echo 0)

# If the checksum has changed, force a node deps update.
ifneq ($(node-package-checksum), $(existing-node-package-checksum))
	_force-deps-refresh=deps-clean deps
else
	_force-deps-refresh=
endif

################################################################################
# Settings affected by the vagrant environment.
################################################################################

is-vagrant:=$(shell ./tools/build/is_vagrant.sh)
ifeq ($(is-vagrant), 1)
	service-root:=/home/vagrant
	phantomjs-service-root:=/home/vagrant
else
	service-root:=$(shell pwd)
	phantomjs-service-root:=$(shell cd ../.. && pwd)
endif

################################################################################
# TARGET: build
#	Build the minified version
################################################################################
build: clean mkdirs resources $(_force-deps-refresh) $(_build_lint_dep)
	@echo "Node version : $(shell node --version)"
	@echo "npm version  : v$(shell npm --version)"
	$(MAKE) --no-print-directory -f core.mk build

################################################################################
# TARGET: checksize
#	Build the compressed version and show sizes
################################################################################
checksize: clean mkdirs resources $(_force-deps-refresh) $(_build_lint_debug_dep)
	@echo "Node version : $(shell node --version)"
	@echo "npm version  : v$(shell npm --version)"
	$(MAKE) --no-print-directory -f core.mk build checksize sourcemaps=false

################################################################################
# TARGET: debug
#	Build the debug version
################################################################################
debug: clean mkdirs resources $(_force-deps-refresh) $(_build_lint_debug_dep)
	@echo
	$(MAKE) --no-print-directory -f core.mk debug

################################################################################
# TARGET: package
#	Package up the files into a deployable bundle, and create a manifest for local
# file deployment.
################################################################################
package: clean mkdirs resources $(_force-deps-refresh) $(_build_lint_dep)
ifeq ($(sc_dev), true)
	$(error Unable to package a development build)
endif
	@echo "Node version : $(shell node --version)"
	@echo "npm version  : v$(shell npm --version)"
	$(MAKE) --no-print-directory -f core.mk build sourcemaps=false
	$(MAKE) --no-print-directory -f core.mk package

################################################################################
# TARGET: clean
#	Clean the target directory.
################################################################################
clean:
	@echo "Cleaning started."
	@rm -fr target/*
	@echo "Cleaning completed."

################################################################################
# TARGET: resources
#	Localize and minify
################################################################################
resources: html css earcons images

################################################################################
# TARGET: html
#	Use handlebars to localize the html
################################################################################
html: mkdirs
	node precompile/compile-html.js $(resource-dir)/html
# TODO precompile help as well, for now just copy the files
	cp -r source/html/help $(resource-dir)/html

################################################################################
# TARGET: css
#	TODO: minify the CSS
################################################################################
css: mkdirs
	cp -r source/css $(resource-dir)
	find $(resource-dir)/css -type f -name '*.css' -execdir $(cleancss) {} -o {} \;
#	@(for F in `ls source/css`; do $(cleancss) -o $(resource-dir)/css/$$F source/css/$$F ; done)

################################################################################
# TARGET: images
#	TODO: minify the SVG
################################################################################
images: mkdirs
	cp -r source/images $(resource-dir)
	find $(resource-dir)/images -type f -name '*.svg' -execdir $(cleansvg) {} -o {} \;

################################################################################
# TARGET: earcons
################################################################################
earcons: mkdirs
	cp -r source/earcons $(resource-dir)

################################################################################
# TARGET: deps
#	Set up the Node.js dependencies.
################################################################################
deps: $(_clean_deps)
	@echo "Dependency setup started."
	@mkdir -p node_modules
	@npm install
	@echo $(node-package-checksum) > $(node-package-checksum-file)
	@echo "Dependency setup completed."

################################################################################
# TARGET: deps-clean
#	Clean the Node.js dependencies.
################################################################################
deps-clean:
	@echo "Cleaning dependencies started."
	@rm -fr node_modules
	@echo "Cleaning dependencies completed."

################################################################################
# TARGET: mkdirs
#	Create the necessary target folders
################################################################################
mkdirs:
# Where sitecues.js goes
	@mkdir -p $(build-dir)/js
# Where all dependent resources will go
	@mkdir -p $(resource-dir)
# Where dependent resources will go
	@mkdir -p $(resource-dir)/js
	@mkdir -p $(resource-dir)/html
	@mkdir -p $(resource-dir)/images
	@mkdir -p $(resource-dir)/css
	@mkdir -p $(resource-dir)/earcons
# Where build-config will go
	@mkdir -p $(build-basedir)/build-config

################################################################################
# TARGET: lint
#	Run lenienter and jshint on the JavaScript source.
#
# ALTERNATE: Run manally
#	jshint source/js
################################################################################
lint:
	@echo "Linting started."
	$(jshint) source/js
	@echo "Linting completed."

################################################################################
# TARGET: lint-debug
#	Run jshint on the JavaScript source but allow debugger
################################################################################
lint-debug:
	@echo "Linting started."
	$(jshint) --config .jshintrc-debug source/js
	@echo "Linting completed."

################################################################################
# TARGET: start-testsite
#	Run the web server as a service, giving access to the library and test pages.
################################################################################
start-testsite:
	@./binary/_web start --timeout $(testsite-timeout) --root $(service-root) -- $(port) $(https) $(prod) $(ports-env-file)

################################################################################
# TARGET: stop-testsite
#	Stop the web server service.
################################################################################
stop-testsite:
	@./binary/_web stop --root $(service-root)

################################################################################
# TARGET: test-all
#	Run all tests.
################################################################################
test-all: test-unit

################################################################################
# TARGET: test-unit
#	Run the unit tests.
################################################################################
test-unit:
	#@echo "TEST RUN ID: $(test-run-id)"
	npm test config=config/intern

################################################################################
# TARGET: stop-all-services
#	Stop all known services.
################################################################################
stop-all-services: stop-testsite

################################################################################
# HIDDEN TARGET: .no-lint-on-build
# 	Alternate target when not linting during build.
################################################################################
.no-lint-on-build:
	@echo "Linting disabled on build."

################################################################################
# HIDDEN TARGET: .no-clean-deps
# 	Alternate target when not cleaning Node.js dependencies.
################################################################################
.no-clean-deps:
	@echo "Cleaning dependencies disabled."

################################################################################
# TARGET: local -- allows sitecues to be used locally or pasted into a console
################################################################################
local: clean $(_force-deps-refresh) $(_build_lint_dep)
	@echo
	$(MAKE) --no-print-directory -f core.mk debug sc-local=true

