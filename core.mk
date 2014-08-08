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
# File sets.
################################################################################

# Production file list (combine all modules into one).
files=\
	$(build-dir)/source/js/core.js \
	source/js/jquery.js \
	source/js/user.js \
	source/js/custom.js \
	$(custom-files) \
	source/js/load.js \
	source/js/conf/user/manager.js \
	source/js/conf/user/server.js \
	source/js/conf/user/provided.js \
	source/js/conf/user.js \
	source/js/conf/site.js \
	source/js/conf.js \
	source/js/platform.js \
	source/js/jquery/cookie.js \
	source/js/jquery/style.js \
	source/js/jquery/effects.js \
	source/js/ui.js \
	source/js/util/common.js \
	source/js/util/geo.js \
	source/js/html-build.js \
	source/js/audio/speech-builder.js \
	source/js/audio/html5-player.js \
	source/js/audio/safari-player.js \
	source/js/audio.js \
	source/js/audio/audio-cues.js \
	source/js/zoom.js \
	source/js/slider.js \
	source/js/panel.js \
	source/js/badge.js \
	source/js/focus.js \
	source/js/mouse-highlight/traitcache.js \
	source/js/mouse-highlight/highlight-position.js \
	source/js/mouse-highlight/traits.js \
	source/js/mouse-highlight/judge.js \
	source/js/mouse-highlight/pick.js \
	source/js/mouse-highlight/pick-debug.js \
	source/js/mouse-highlight.js \
	source/js/keys.js \
	source/js/cursor/images/win.js \
	source/js/cursor/images/mac.js \
	source/js/cursor/images/manager.js \
	source/js/cursor/custom.js \
	source/js/cursor.js \
	source/js/fixed-position-fixer.js \
	source/js/hlb/safe-area.js \
	source/js/hlb/styling.js \
	source/js/hlb/positioning.js \
	source/js/hlb/dimmer.js \
	source/js/hlb/event-handlers.js \
	source/js/hlb/animation.js \
	source/js/highlight-box.js \
	source/js/hpan.js \
	source/js/util/template.js \
	source/js/status.js \
	source/js/metrics/util.js \
	source/js/metrics/page-visited.js \
	source/js/metrics/panel-closed.js \
	source/js/metrics/badge-hovered.js \
	source/js/metrics/hlb-opened.js \
	source/js/metrics.js \

################################################################################
# TARGET: build
################################################################################
build:
	@echo "===== STARTING: Building '$(custom-name)' library ====="
	@echo

	@mkdir -p $(build-dir)/source/js

	@sed 's%0.0.0-UNVERSIONED%'$(custom-version)'%g' source/js/core.js > $(build-dir)/source/js/core.js

	@mkdir -p $(build-dir)/compile/js

	@uglifyjs -m -c dead_code=true --define SC_DEV=false,SC_UNIT=false -o $(build-dir)/compile/js/sitecues.js --source-map $(build-dir)/compile/js/sitecues.js.map --source-map-url sitecues.js.map $(files)

#Copy files for Source-Maps
	@mkdir -p $(build-dir)/js/source
	@cp -R source/js $(build-dir)/js/source/

	@mkdir -p $(build-dir)/etc/js
	@cp -r source/js/_config $(build-dir)/etc/js
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/etc ; done)
	@echo

	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	@echo
	@(cd $(build-dir)/compile/js ; for FILE in *.js ; do \
		gzip -c $$FILE > $$FILE.gz ; \
	done)


	@echo "* File sizes$(min-label):"
	@(cd $(build-dir)/compile/js ; \
	for FILE in `ls *.js *.js.gz | sort` ; do \
		printf "*  %-16s $$(ls -lh $$FILE | awk '{print($$5);}')\n" $$FILE ; \
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

	@mkdir -p $(build-dir)/source/js

	@sed 's%0.0.0-UNVERSIONED%'$(custom-version)'%g' source/js/core.js > $(build-dir)/source/js/core.js

	@mkdir -p $(build-dir)/compile/js
	@uglifyjs $(uglifyjs-args) -o $(build-dir)/compile/js/sitecues.js --source-map $(build-dir)/compile/js/sitecues.js.map --source-map-url sitecues.js.map $(files)

#Copy files for Source-Maps
	@mkdir -p $(build-dir)/js/source
	@cp -R source/js $(build-dir)/js/source/

	@echo "SC_DEV=true,SC_UNIT=true,exports={}," > $(build-dir)/compile/js/sitecues.js
	@(awk 'FNR==1{print ""}1' $(files)) >> $(build-dir)/compile/js/sitecues.js

	@mkdir -p $(build-dir)/etc/js
	@cp -r source/js/_config $(build-dir)/etc/js
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/etc ; done)
	@echo

	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	@echo
	@(cd $(build-dir)/compile/js ; for FILE in *.js ; do \
		gzip -c $$FILE > $$FILE.gz ; \
	done)


	@echo "* File sizes$(min-label):"
	@(cd $(build-dir)/compile/js ; \
	for FILE in `ls *.js *.js.gz | sort` ; do \
		printf "*  %-16s $$(ls -lh $$FILE | awk '{print($$5);}')\n" $$FILE ; \
	done)

	@echo
	@echo "===== COMPLETE: Building '$(custom-name)' library (DEBUG VER) ====="
	@echo
	@echo "===== VERSION: $(custom-version)"
	@echo



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

	@tar -C $(package-basedir) -zcf $(build-basedir)/$(package-file-name) $(package-name)
	@echo "===== COMPLETE: Packaging '$(custom-name)' library"
	@echo
