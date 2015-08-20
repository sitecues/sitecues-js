################################################################################
# sitecues JavaScript Library Core Makefile
#	NOTE: This make file should not be called directly, and instead should be
#	called via 'makefile'. Any variables declared in 'makefile' that are needed
#	by this file must be exported in 'makefile'.
################################################################################

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

	@mkdir -p $(build-dir)/source/js

	@sed 's%0.0.0-UNVERSIONED%'$(custom-version)'%g' source/js/core.js > $(build-dir)/source/js/core.js

	@mkdir -p $(build-dir)/compile/js

	@uglifyjs -m -c dead_code=true --define SC_DEV=false,SC_UNIT=false,SC_LOCAL=false -o $(build-dir)/compile/js/sitecues.js $(files)

#Copy files for Source-Maps

	@mkdir -p $(build-dir)/etc/js
	@(for F in `ls -d source/* | grep -Ev '^source/js$$'` ; do cp -r $$F $(build-dir)/etc ; done)
	@echo

	@echo "===== GZIP: Creating compressed (gzipped) JavaScript files."
	@echo
	@(cd $(build-dir)/compile/js ; for FILE in *.js ; do \
		gzip -c $$FILE > $$FILE.gz ; \
	done)


	@echo "* File sizes$(min-bsbel):"
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

	@mkdir -p $(build-dir)/compile/js
	@node node_modules/.bin/r.js -o baseUrl=source/js name=core out=$(build-dir)/compile/js/sitecues.js
	@uglifyjs $(uglifyjs-args) -o $(build-dir)/compile/js/sitecues.js --source-map $(build-dir)/compile/js/sitecues.js.map --source-map-url sitecues.js.map $(files)

#Copy files for Source-Maps
	@mkdir -p $(build-dir)/js/source
	@cp -R source/js $(build-dir)/js/source/

	@echo "SC_DEV=true,SC_UNIT=false,"$(extra-debug-flags) > $(build-dir)/compile/js/sitecues.js
	@(awk 'FNR==1{print ""}1' $(files)) >> $(build-dir)/compile/js/sitecues.js

	@mkdir -p $(build-dir)/etc/js
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
	@cp -R source/earcons $(package-dir)
	@cp -R source/html $(package-dir)

	@tar -C $(package-basedir) -zcf $(build-basedir)/$(package-file-name) $(package-name)
	@echo "===== COMPLETE: Packaging '$(custom-name)' library"
	@echo
