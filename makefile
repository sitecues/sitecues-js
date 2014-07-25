################################################################################
# sitecues JavaScript Library Main Makefile
################################################################################

################################################################################
# DEFAULT TARGET: all
# 	(To keep this target as the defaulty target, this target must be
#	 declared before all other targets).
# 	Clean the target direcetory, update Node.js dependecies, and build the
#	JavaScript library.
################################################################################
all: clean build debug

################################################################################
# Command line options.
################################################################################

targets=common $(shell cd custom-config && ls *.mk | sed 's%.mk%%g')
custom-config-names:=$(shell echo "$(targets)" | sed 's%,% %g')

# If true, clean and update the Node.js package dependencies.
clean-deps=false

# Whether or not to enable HTTPS on the test server. 
https=off

# Whether or not to lint the codebase before the build. 
lint=false

# Node.js express test server HTTP port.
port=8000

# Whether or not to run the test server in prod-only mode, in which source
# file locations will not be checked for async module loads. 
prod=off


# The build version.
export version=$(default-version)

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
default-version:=0.0.$(shell date -u +'%Y%m%d%H%M%S')-LOCAL-$(username)

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
else
	_build_lint_dep:=.no-lint-on-build
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
#	Build the compressed file and, optionally, run gjslint.
################################################################################
build: $(_force-deps-refresh) $(_build_lint_dep)
	@echo
	@for _CUSTOM_CONF_NAME in $(custom-config-names) ; do \
		$(MAKE) --no-print-directory -f core.mk build custom-config-name=$$_CUSTOM_CONF_NAME ; \
	done

################################################################################
# TARGET: debug
#	Build the debug version
################################################################################
debug: $(_force-deps-refresh) $(_build_lint_dep)
	@echo
	@for _CUSTOM_CONF_NAME in $(custom-config-names) ; do \
		$(MAKE) --no-print-directory -f core.mk debug custom-config-name=$$_CUSTOM_CONF_NAME ; \
	done

################################################################################
# TARGET: package
#	Package up the files into a deployable bundle, and create a manifest for local
# file deployment.
################################################################################
package: build
ifeq ($(sc_dev), true)
	$(error Unable to package a development build)
endif
	@for _CUSTOM_CONF_NAME in $(custom-config-names) ; do \
		$(MAKE) --no-print-directory -f core.mk package custom-config-name=$$_CUSTOM_CONF_NAME ; \
	done

################################################################################
# TARGET: clean
#	Clean the target directory.
################################################################################
clean:
	@echo "Cleaning started."
	@rm -fr target
	@echo "Cleaning completed."

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
# TARGET: lint
#	Run lenienter on the JavaScript source.
#
# ALTERNATE: Run Google Closure Linter
#	@gjslint --nojsdoc -r source/js
################################################################################
lint:
	@echo "Linting started."
	@lenient-lint --beep --error_trace --multiprocess --nojsdoc -r source/js --summary --time --unix_mode
	@echo "Linting completed."

################################################################################
# TARGET: run
#	Run the web server, giving access to the library and test pages.
#	DEPRECATED: Use start-testsite instead
################################################################################
run:
	@./binary/web.js $(port) $(https) $(prod)

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
test-all: test-unit test-smoke

################################################################################
# TARGET: test-smoke
#	Run the smoke tests.
################################################################################
test-smoke:
	#$(MAKE) --no-print-directory start-testsite prod=on
	#@for _CUSTOM_CONF_NAME in $(custom-config-names) ; do \
	#	$(MAKE) --no-print-directory -f core.mk test-smoke custom-config-name=$$_CUSTOM_CONF_NAME ; \
	#done
	@echo '===== Target test-smoke currently disabled ====='

################################################################################
# TARGET: test-unit
#	Run the unit tests.
################################################################################
test-unit:
	@echo "TEST RUN ID: $(test-run-id)"
	@cd ./tests/unit ; ../../node_modules/mocha/bin/mocha $(testunit-mocha-options)

################################################################################
# TARGET: nyan-test
#	Run unit test with nyan-cat because awesome
################################################################################
nyan-unit:
	@echo "TEST RUN ID: $(test-run-id)"
	@cd ./tests/unit ; ../../node_modules/mocha/bin/mocha -R nyan

################################################################################
# TARGET: dot-unit
################################################################################
dot-unit:
	@echo "TEST RUN ID: $(test-run-id)"
	@cd ./tests/unit ; ../../node_modules/mocha/bin/mocha -R dot


################################################################################
# TARGET: nyan-test
#	Get test coverage output using blanket and mocha for node
################################################################################
test-coverage:
	@echo "TEST RUN ID: $(test-run-id)"
	@mkdir -p ./report
	@cd ./tests/unit ; ../../node_modules/mocha/bin/mocha -r blanket -R html-cov > ../../report/unit-test-coverage.html
	@echo Coverage report generated in: ./report/unit-test-coverage.html

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

