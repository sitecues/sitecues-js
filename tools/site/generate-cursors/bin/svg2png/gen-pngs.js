var png_output_path     = './cursor_output/png/'
  , cur_output_path     = './cursor_output/cur/'
  , cur_scriptpath      = './bin/icotool/icotool'
  , cur_scriptname      = './bin/icotool/png2cur'
  , phantom = require('node-phantom')
  ;

phantom.create(function(err,ph) {

  return ph.createPage(function(err,page) {
    return page.open("./bin/svg2png/convert-svgs-to-dataurls.html", function(err,status) {
      
      console.log("Loading SVGs into Canvas via PhantomJS? ", status);
        
        setTimeout(function() {
          return page.evaluate(function() {

            var dataURLS = document.getElementsByTagName('dataurl');

            var results = [];

            for(var i=0, l=dataURLS.length; i< l; i++){
              results.push({
                title: dataURLS[i].title,
                hotspotX: dataURLS[i].getAttribute('data-hotspotx'),
                hotspotY: dataURLS[i].getAttribute('data-hotspoty'),
                data: dataURLS[i].innerHTML
              });
            }

            return results;

          }, function(err,result) {


            // Output DATA URLS to PNG Files
            var fs      = require('fs')
              , i       = 0
              , l       = result.length
              , dataURL
              , fileName
              ;

            // icotool is opensource. from: http://sveinbjorn.org/how_to_create_retina_favicon_using_icotool
            console.log('Creating \''+cur_scriptname+'\' script for .cur generation.');
            fs.writeFile(cur_scriptname, '', function(err) {
              if(err) {
                console.log(err);
              } else {
                console.log('Cleared \''+cur_scriptname+'\' script.');
              }
            });

            var regex = /^data:.+\/(.+);base64,(.*)$/
              , matches
              , ext
              , data
              , buffer
              , string
              , pathAndFile
              , hotspotCommand
              ;

            for(; i< l; i++){

              fileName = result[i].title;
              console.log('Saving DataURL to: ' + fileName+'.png');
              dataURL=result[i].data;
              // console.log(result[i].data);

              matches = dataURL.match(regex);
              ext = matches[1];
              data = matches[2];
              buffer = new Buffer(data, 'base64');          

              pathAndFile = './'+png_output_path+fileName+'.png';

              fs.writeFileSync( pathAndFile, buffer );

              hotspotCommand =  cur_scriptpath + ' ' +
              '-o ./'+cur_output_path+fileName + '.cur -c ' +
              '-X ' + result[i].hotspotX + ' ' +
              '-Y ' + result[i].hotspotY + ' ' +
              pathAndFile + '\n';

              // Begin creating script for hotpots used in icon conversion
              fs.appendFile(cur_scriptname, hotspotCommand, function (err) {
                if(err) {
                  console.log(err);
                } else {
                  console.log('Append script: ' + hotspotCommand.split('\n')[0]);
                }                
              });

            }

            ph.exit();
          });

        // Delay so the page javascript has a chance to draw the cursors
        }, 5000);

    });
  });
});