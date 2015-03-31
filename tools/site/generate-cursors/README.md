OLD INSTRUCTIONS
================

These are from Alistair -- Aaron and Tony could not get them to work.

  - Prepare the .SVG files
  - Update "convert-svgs-to-dataurls.js" to include paths to .SVGs
  - Run "node save-pngs.js" (should take some time to do generate all files)
  - Check png-output contains .PNG files
  - Batch convert .PNG files to .ICO icons using software such as: "iConvert Icons"
  - Run "ico2cur.py -x [int] -y [int]" on the icons

NEW INSTRUCTIONS
================

These instructions are only for updating Windows cursors, since every browser except IE now uses .svg cursors built on-the-fly by cursor.js.

  1. Prepare the .SVG files. You can edit the paths using tools/generate-cursors/bin/svg-path-edit/adjustSVG-pc-default-cursor.html
  2. At some point the cursor_input folder .SVGs need to be updated with the correct path
     It works to copy and paste in the paths from from tools/generate-cursors/bin/svg-path-edit/adjustSVG-pc-default-cursor.html
  3. Run the script create-all-win-svgs. This will update the cursor_output/svg folder.
  4. Load the following page: tools/generate-cursors/viewer/index.html -- it will show each cursor
  5. Manually save each cursor to cursor_output/png with the correct name using right click + save as
  6. Download iconutil (try npm install iconutil)
  7. Run bin/icoutil/png2cur
  8. Copy cursor_output/cur to source/images/cursors
  