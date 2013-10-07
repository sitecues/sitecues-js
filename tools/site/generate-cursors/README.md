INSTRUCTIONS
============

1) Prepare the .SVG files
2) Update "convert-svgs-to-dataurls.js" to include paths to .SVGs
3) Run "node save-pngs.js" (should take some time to do generate all files)
4) Check png-output contains .PNG files
5) Batch convert .PNG files to .ICO icons using software such as: "iConvert Icons"
6) Run "ico2cur.py -x [int] -y [int]" on the icons