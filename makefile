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
# Command line options -- defaults
################################################################################

# If true, clean and update the Node.js package dependencies.
# TODO this should use on/off instead of true/false for consistency
clean-deps=false

# Whether or not to enable HTTPS on the test server.
https=off

# Whether or not to lint the codebase before the build.
lint=on

# Node.js express test server HTTP port.
port=8000

# Default clean option is only clean the target/foo folder being built
clean=off

# Default type (other type is extension)
type=common

################################################################################
# Tools
################################################################################
export md5sum:=$(shell which 'md5sum' > /dev/null 2>&1 && echo 'md5sum' || echo 'md5 -q')
export rmd5=$(shell echo "$$(hostname)$$(date +'%s%N')" | $(md5sum) | cut -f 1 -d ' ')

################################################################################
# Settings/constants.
################################################################################

# The default test run ID
export default-test-run-rmd5:=$(rmd5)
default-test-run-id=$(username)-$(default-test-run-rmd5)
export test-run-id=$(default-test-run-id)
# Version number

export VERSION=$(version)

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

gulp:=TYPE=$(type) LOCAL=$(local) CLEAN=$(clean) LINT=$(lint) node_modules/.bin/gulp

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
# TARGET: build
#	Build the minified version
################################################################################
build: $(_force-deps-refresh)
	DEBUG=off MINIFY=on SHOW_GZIP_SIZE=on $(gulp)

################################################################################
# TARGET: debug
#	Build the debug version
################################################################################
debug: $(_force-deps-refresh)
	$(gulp)

################################################################################
# TARGET: package
#	Build and package up the files into a deployable bundle
################################################################################
package: $(_force-deps-refresh)
	DEBUG=off MINIFY=on $(gulp) package

################################################################################
# TARGET: clean
################################################################################
clean:
	node_modules/.bin/gulp cleanAll

################################################################################
# TARGET: deps
#	Set up the Node.js dependencies.
################################################################################
deps: $(_clean_deps)
	@echo "Dependency setup started."
	@mkdir -p node_modules
	@npm install --progress=false
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
# HIDDEN TARGET: .no-clean-deps
# 	Alternate target when not cleaning Node.js dependencies.
################################################################################
.no-clean-deps:
	@echo "Cleaning dependencies disabled."

