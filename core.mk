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

ifeq ($(sc-local), true)
	# Build a version that doesn't use AJAX for settings, config or metrics -- can be used locally or pasted into a console
	extra-debug-flags="SC_LOCAL=true,"
else
	extra-debug-flags="SC_LOCAL=false,"
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
	@node node_modules/.bin/r.js -o baseUrl=source/js generateSourceMaps=true preserveLicenseComments=false optimize=uglify2 name=core out=target/compile/js/sitecues.js
	# Copy all files to final target directory
	@cp -R target/compile/js/* $(build-dir)/compile/js
	# Overwrite sitecues.js with one that has the version set
	@sed 's%0.0.0-UNVERSIONED%'$(custom-version)'%' target/compile/js/sitecues.js > $(build-dir)/compile/js/sitecues.js

	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	@echo
	@(cd $(build-dir)/compile/js ; for FILE in *.js ; do \
		gzip -c $$FILE > $$FILE.gz ; \
	done)

	@echo "* File sizes:"
	@(cd $(build-dir)/compile/js ; \
	for FILE in `ls *.js *.js.gz | sort` ; do \
		printf "*  %-16s $$(ls -l $$FILE | awk '{print($$5);}')\n" $$FILE ; \
	done)

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
	@node node_modules/.bin/r.js -o baseUrl=source/js name=core generateSourceMaps=true preserveLicenseComments=false optimize=none out=target/compile/js/sitecues.js
	# Copy all files to final target directory
	@cp -R target/compile/js/* $(build-dir)/compile/js
  # Prefix sitecues.js with code to set the global variables. The rest of sitecues.js will be added on top
	@echo "SC_DEV=true,SC_UNIT=false,"$(extra-debug-flags) > $(build-dir)/compile/js/sitecues.js
	# Add to the final sitecues.js the compiled code with version set
	@sed 's%0.0.0-UNVERSIONED%'$(custom-version)'%' target/compile/js/sitecues.js >> $(build-dir)/compile/js/sitecues.js

	@echo "* File sizes:"
	@(cd $(build-dir)/compile/js ; \
	for FILE in `ls *.js | sort` ; do \
		printf "*  %-16s $$(ls -l $$FILE | awk '{print($$5);}')\n" $$FILE ; \
	done)

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
