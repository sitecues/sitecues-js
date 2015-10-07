################################################################################
# sitecues JavaScript Library Core Makefile
#	NOTE: This make file should not be called directly, and instead should be
#	called via 'makefile'. Any variables declared in 'makefile' that are needed
#	by this file must be exported in 'makefile'.
################################################################################

################################################################################
# Load the custom configuration file
################################################################################

# Are we making a local-only version?
ifeq ($(sc-local), true)
	# Build a version that doesn't use AJAX for settings, config or metrics -- can be used locally or pasted into a console
else
	sc-local=false
endif

# Are we making a jquery-only version?
ifeq ($(zepto), false)
	allow-zepto=false
else
	allow-zepto=true
endif

# Are we building sourcemaps?
ifneq ($(sourcemaps), false)
	sourcemaps=true
endif

# Keep original source
gzip-command='gzip -c "{}" > "{}.gz"'
# The command if we don't want to keep the original:
# gzip-command='gzip "{}"'


# Set up the build-specific directory and package name.
build-basedir:=target
build-dir:=$(build-basedir)/common
package-name:=$(product-name)-js-$(version)
package-file-name:=$(package-name).tgz
package-basedir:=$(build-dir)/package
package-dir:=$(package-basedir)/$(package-name)


################################################################################
# TARGET: build
################################################################################
build:
	@echo "===== STARTING: Building sitecues library ====="
	@echo

	# Where sitecues.js goes
	@mkdir -p $(build-dir)/js
	# Where all dependent resources will go
	@mkdir -p $(build-dir)/$(version)
	# Where dependent JS will go
	@mkdir -p $(build-dir)/$(version)/js
	# Where build-config will go
	@mkdir -p target/build-config
	echo "sitecues.version='$(version)';" > target/build-config/config.js

	# Require.js build
	# TODO not sure if we want use strict in production versions -- good temporarily though
	node node_modules/.bin/r.js -o rjs-build-options.js baseUrl=source/js generateSourceMaps=$(sourcemaps) optimize=uglify2 uglify2.compress.global_defs.SC_DEV=false uglify2.compress.global_defs.SC_LOCAL=$(sc-local) uglify2.compress.global_defs.SC_UNIT=false dir=$(build-dir)/$(version)/js wrap.start="'use strict';"

	# Move sitecues.js out of version-named subfolder into /js (up one directory)
	# This is because sitcues.js is loaded by the load script, which knows nothing of versions
	# All other dependent resources are loaded by JS and are versioned
	mv $(build-dir)/$(version)/js/sitecues.js $(build-dir)/js

	# Insert runtime bundle configuration
	./finalize-loader-config.js $(build-dir)/js/sitecues.js target/build-config/sitecues-bundles.js $(allow-zepto) $(version)
	#./finalize-loader-config.js $(build-dir)/js/sitecues-ie9.js target/build-config/sitecues-bundles-ie9.js false $(version)

	# Copy non-js files, such as css, images, html, audio files
	@mkdir -p $(build-dir)/$(version)
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/$(version) ; done)
	@echo

	@echo "---- sitecues core source --------------------------------"
	@./show-file-sizes.sh $(build-dir)/js "sitecues.js"
	@echo "---- additional bundles source ---------------------------"
	@./show-file-sizes.sh $(build-dir)/$(version)/js "*.js" | grep -v ".src.js"

	@echo
	@echo "===== COMPLETE: Building sitecues library"
	@echo
	@echo "===== VERSION: $(version)"
	@echo

################################################################################
# TARGET: checksize
################################################################################
checksize:
	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	@cd $(build-dir)/js ; find . -type f -name '*.js' ! -name "*.map" ! -name "*.src.js" -exec sh -c $(gzip-command) \;
	@cd $(build-dir)/$(version)/js ; find . -type f -name '*.js' ! -name "*.map" ! -name "*.src.js" -exec sh -c $(gzip-command) \;

  # Show file sizes but not for foo.src.bar -- those are built by r.js for sourcemaps
	@echo "**** File sizes ******************************************"
	@echo
	@echo "---- sitecues core zipped --------------------------------"
	@./show-file-sizes.sh $(build-dir)/js "sitecues*.js.gz"
	@echo "----- additional bundles zipped --------------------------"
	@./show-file-sizes.sh $(build-dir)/$(version)/js "*.js.gz"

################################################################################
# TARGET: debug
################################################################################
debug:
	@echo "===== STARTING: Build for sitecues library (DEBUG VER) ====="
	@echo

	# Where sitecues.js goes
	@mkdir -p $(build-dir)/js
	# Where all dependent resources will go
	@mkdir -p $(build-dir)/$(version)
	# Where dependent JS will go
	@mkdir -p $(build-dir)/$(version)/js
	# Where build-config will go
	@mkdir -p target/build-config
	echo "sitecues.version='$(version)';var SC_LOCAL=$(sc-local),SC_DEV=true,SC_UNIT=false;" > target/build-config/config.js

	# Require.js build
	node node_modules/.bin/r.js -o rjs-build-options.js baseUrl=source/js generateSourceMaps=$(sourcemaps) optimize=none dir=$(build-dir)/$(version)/js wrap.start='"use strict";'

	# Move sitecues.js out of version-named subfolder into /js (up one directory)
	# This is because sitcues.js is loaded by the load script, which knows nothing of versions
	# All other dependent resources are loaded by JS and are versioned
	mv $(build-dir)/$(version)/js/sitecues.js $(build-dir)/js

	# Insert runtime bundle configuration
	./finalize-loader-config.js $(build-dir)/js/sitecues.js target/build-config/sitecues-bundles.js $(allow-zepto) $(version)
	#./finalize-loader-config.js $(build-dir)/js/sitecues-ie9.js target/build-config/sitecues-bundles-ie9.js false $(version)

	# Non-js files, such as css, images, html, audio files
	@mkdir -p $(build-dir)/$(version)
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/$(version) ; done)
	@echo

	@echo "**** File sizes ******************************************"
	@echo "---- sitecues core source --------------------------------"
	@./show-file-sizes.sh $(build-dir)/js "sitecues*.js"
	@echo "---- additional bundles source ---------------------------"
	@./show-file-sizes.sh $(build-dir)/$(version)/js "*.js" | grep -v "sitecues"

	@echo
	@echo "===== COMPLETE: Building sitecues library (DEBUG VER) ====="
	@echo
	@echo "===== VERSION: $(version)"
	@echo

################################################################################
# TARGET: package
################################################################################
package:
	@echo "===== STARTING: Packaging sitecues library"
	echo $(version) > $(build-dir)/VERSION.TXT
	echo "SC_BUILD_NAME=common" > $(build-dir)/BUILD.TXT

	tar --exclude='*.src.js' --exclude='*.js.map' -C $(build-dir) -zcf $(build-basedir)/$(package-file-name) .
	@echo "===== COMPLETE: Packaging sitecues library"
	@echo
