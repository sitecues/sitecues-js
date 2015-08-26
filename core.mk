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

	@mkdir -p $(build-dir)/compile/js
	@mkdir -p $(build-dir)/compile/config
	echo "sitecues.version='$(custom-version)';" > $(build-dir)/compile/config/config.js

	# Require.js build
	node node_modules/.bin/r.js -o requirejs-build-options.js baseUrl=source/js optimize=uglify2 uglify2.compress.global_defs.SC_DEV=false uglify2.compress.global_defs.SC_LOCAL=$(sc-local) uglify2.compress.global_defs.SC_UNIT=false dir=$(build-dir)/compile/js wrap.start="'use strict';"
	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	@echo
	@(cd $(build-dir)/compile/js ; for FILE in *.js ; do \
		gzip -c $$FILE > $$FILE.gz ; \
	done)

  # Show file sizes but not for foo.src.bar -- those are built by r.js for sourcemaps
	@echo "* File sizes:"
	@echo -----------------------------------
	@./show-file-sizes.sh $(build-dir)/compile/js "sitecues.*" | grep -v "\.src|\.map"
	@echo -----------------------------------
	@./show-file-sizes.sh $(build-dir)/compile/js "*.js" | grep -v "\.src\.|sitecues\.js"
	@echo -----------------------------------
	@./show-file-sizes.sh $(build-dir)/compile/js "*.js.gz" | grep -v "\.src\.|sitecues\.js"

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

	@mkdir -p $(build-dir)/compile/js
	@mkdir -p $(build-dir)/compile/config
	echo "sitecues.version='$(custom-version)';var SC_LOCAL=$(sc-local),SC_DEV=false,SC_UNIT=false;" > $(build-dir)/compile/config/config.js

	# Require.js build
	# TODO add 'use strict' inside each module to help throw exceptions in debug mode
	node node_modules/.bin/r.js -o requirejs-build-options.js baseUrl=source/js optimize=none dir=$(build-dir)/compile/js

	@echo "* File sizes:"
	@./show-file-sizes.sh $(build-dir)/compile/js "*.js"

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
	@mkdir -p $(package-dir)
	@echo $(custom-version) > $(package-dir)/VERSION.TXT
	@echo "SC_BUILD_NAME=$(custom-name)" > $(package-dir)/BUILD.TXT
	@echo "SC_BUILD_SUFFIX=$(custom-suffix)" >> $(package-dir)/BUILD.TXT

	@cp -R $(build-dir)/compile/* $(package-dir)

	#Make dir for Source-Maps
	@mkdir -p $(package-dir)/js/source/
	@mkdir -p $(package-dir)/js/$(build-dir)/source/js/
	#Copy files for Source-Maps
	@cp -R source/js $(package-dir)/js/source/
	@cp $(build-dir)/source/js/core.js $(package-dir)/js/$(build-dir)/source/js/core.js

	@cp -R source/images $(package-dir)
	@cp -R source/earcons $(package-dir)
	@cp -R source/html $(package-dir)

	@tar -C $(package-basedir) -zcf $(build-basedir)/$(package-file-name) $(package-name)
	@echo "===== COMPLETE: Packaging '$(custom-name)' library"
	@echo
