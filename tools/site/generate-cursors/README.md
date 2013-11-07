INSTRUCTIONS
============

  - Prepare the .SVG files
  - Update "convert-svgs-to-dataurls.js" to include paths to .SVGs
  - Run "node save-pngs.js" (should take some time to do generate all files)
  - Check png-output contains .PNG files
  - Batch convert .PNG files to .ICO icons using software such as: "iConvert Icons"
  - Run "ico2cur.py -x [int] -y [int]" on the icons