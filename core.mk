################################################################################
# sitecues JavaScript Library Core Makefile
#	NOTE: This make file should not be called directly, and instead should be
#	called via 'makefile'. Any variables declared in 'makefile' that are needed
#	by this file must be exported in 'makefile'.
################################################################################

################################################################################
# Load the custom configuration file
################################################################################

# Not a fan of special cases, but 'common' is a special case.
ifeq ($(custom-config-name), common)
	custom-name=common
	custom-files=
	# The common build does not modify the version, etc...
	custom-suffix=
	custom-suffix-upper=
else
	# Include the 'configuration' file.
	include custom-config/$(custom-config-name).mk
	# The custom builds append their name to the version, etc...
	custom-suffix=-$(custom-name)
	custom-suffix-upper=-$(shell echo $(custom-name) | $(to-upper))
endif

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
ifeq ($(sourcemaps), false)
  gzip-command='gzip "{}"'
else
  gzip-command='gzip -c "{}" > "{}.gz"'
  sourcemaps=true
endif

# Make a build-specific version.
custom-version=$(version)$(custom-suffix-upper)

# Set up the build-specific directory and package name.
build-basedir:=target
build-dir:=$(build-basedir)/$(custom-name)
package-name:=$(product-name)-js-$(custom-version)
package-file-name:=$(package-name).tgz
package-basedir:=$(build-dir)/package
package-dir:=$(package-basedir)/$(package-name)


################################################################################
# TARGET: build
################################################################################
build:
	@echo "===== STARTING: Building '$(custom-name)' library ====="
	@echo

	@mkdir -p $(build-dir)/js
	@mkdir -p target/build-config
	echo "sitecues.version='$(custom-version)';" > target/build-config/config.js

	# Require.js build
	node node_modules/.bin/r.js -o rjs-build-options.js baseUrl=source/js generateSourceMaps=$(sourcemaps) optimize=uglify2 uglify2.compress.global_defs.SC_DEV=false uglify2.compress.global_defs.SC_LOCAL=$(sc-local) uglify2.compress.global_defs.SC_UNIT=false dir=$(build-dir)/js wrap.start="'use strict';"

	# Insert runtime bundle configuration
	./finalize-loader-config.js target/common/js/sitecues.js target/build-config/sitecues-bundles.js $(allow-zepto)
	./finalize-loader-config.js target/common/js/sitecues-ie9.js target/build-config/sitecues-bundles.js false

	# Non-js files, such as css, images, html, audio files
	@mkdir -p $(build-dir)/etc
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/etc ; done)
	@echo

	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	echo $(gzip-command)
	@cd $(build-dir)/js ; find . -type f -name '*.js' ! -name "*.map" ! -name "*.src.js" -exec sh -c $(gzip-command) \;

  # Show file sizes but not for foo.src.bar -- those are built by r.js for sourcemaps
	@echo "**** File sizes ******************************************"
	@echo
	@echo "---- sitecues core zipped --------------------------------"
	@./show-file-sizes.sh $(build-dir)/js "sitecues*.js.gz"
	@echo "----- additional bundles zipped --------------------------"
	@./show-file-sizes.sh $(build-dir)/js "*.js.gz" | grep -v "sitecues"
# Uncomment if you want to see raw file sources before zipping
#	@echo
#	@echo "---- sitecues core source --------------------------------"
#	@./show-file-sizes.sh $(build-dir)/js "sitecues.js"
#	@echo "---- additional bundles source ---------------------------"
#	@./show-file-sizes.sh $(build-dir)/js "*.js"

	@echo
	@echo "===== COMPLETE: Building '$(custom-name)' library"
	@echo
	@echo "===== VERSION: $(custom-version)"
	@echo

################################################################################
# TARGET: debug
################################################################################
debug:
	@echo "===== STARTING: Build for '$(custom-name)' library (DEBUG VER) ====="
	@echo

	@mkdir -p $(build-dir)/js
	@mkdir -p target/build-config
	echo "sitecues.version='$(custom-version)';var SC_LOCAL=$(sc-local),SC_DEV=true,SC_UNIT=false;" > target/build-config/config.js

	# Require.js build
	# TODO add 'use strict' inside each module to help throw exceptions in debug mode
	node node_modules/.bin/r.js -o rjs-build-options.js baseUrl=source/js generateSourceMaps=$(sourcemaps) optimize=none dir=$(build-dir)/js

	# Insert runtime bundle configuration
	./finalize-loader-config.js target/common/js/sitecues.js target/build-config/sitecues-bundles.js $(allow-zepto)
	./finalize-loader-config.js target/common/js/sitecues-ie9.js target/build-config/sitecues-bundles.js false

	# Non-js files, such as css, images, html, audio files
	@mkdir -p $(build-dir)/etc
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/etc ; done)
	@echo

	@echo "**** File sizes ******************************************"
	@echo "---- sitecues core source --------------------------------"
	@./show-file-sizes.sh $(build-dir)/js "sitecues*.js"
	@echo "---- additional bundles source ---------------------------"
	@./show-file-sizes.sh $(build-dir)/js "*.js" | grep -v "sitecues"

#	@echo
#	@echo "===== COMPLETE: Building '$(custom-name)' library (DEBUG VER) ====="
#	@echo
#	@echo "===== VERSION: $(custom-version)"
#	@echo

################################################################################
# TARGET: package
################################################################################
package:
	@echo "===== STARTING: Packaging '$(custom-name)' library"
	rm -rf $(package-dir)
	mkdir -p $(package-dir)
	echo $(custom-version) > $(package-dir)/VERSION.TXT
	echo "SC_BUILD_NAME=$(custom-name)" > $(package-dir)/BUILD.TXT
	echo "SC_BUILD_SUFFIX=$(custom-suffix)" >> $(package-dir)/BUILD.TXT

	# Deep copy of $(build-dir)
	cp -R $(build-dir)/js/* $(package-dir)

  # Copy all the resources
	cp -R $(build-dir)/etc/* $(package-dir)

	tar -C $(package-basedir) -zcf $(build-basedir)/$(package-file-name) $(package-name)
	@echo "===== COMPLETE: Packaging '$(custom-name)' library"
	@echo
