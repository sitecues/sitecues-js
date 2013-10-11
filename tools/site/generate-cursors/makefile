all:
	@echo "Opening HTML page with node-phantom."
	@echo "HTML Page will convert SVGs from ./cursor_input/ to DataURLS."
	@echo "Node will save DataURLS to .png files in ./cursor_output/png/"
	@node ./bin/svg2png/gen-pngs.js
	@echo "chmod-ing icotool script for execution (if not already created)."
	@chmod +x ./bin/icotool/png2cur
	@echo "icotool will now convert .png files to .cur files (with correct hotspot offsets)."
	@./bin/icotool/png2cur
	@echo "Finished!"
	@echo "Please check ./cursor_output/cur/ to see your generated cursor files."
