var png_output_path     = 'cursor_output/png/'
  , ico_output_path     = 'cursor_output/ico/'
  , cur_output_path     = 'cursor_output/cur/'
  , ico2cur_scriptpath  = './res/ico2cur/ico2cur.py'
  , phantom = require('node-phantom')
  ;

phantom.create(function(err,ph) {

  return ph.createPage(function(err,page) {
    return page.open("./convert-svgs-to-dataurls.html", function(err,status) {
      
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

            fs.writeFile('icons2cursors.sh', '', function(err) {
              if(err) {
                console.log(err);
              } else {
                console.log('Cleared \'ico2curHotspots.sh\' script.');
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
              console.log('Saving PNG: ' + fileName+'.png');
              dataURL=result[i].data;
              // console.log(result[i].data);

              matches = dataURL.match(regex);
              ext = matches[1];
              data = matches[2];
              buffer = new Buffer(data, 'base64');            

              pathAndFile = './'+png_output_path+'/'+fileName+'.png', buffer;

              fs.writeFileSync( pathAndFile, buffer );

              hotspotCommand =  'python '+ico2cur_scriptpath+' ./'+ico_output_path+fileName +'.ico '+
                                '-x ' + result[i].hotspotX + ' ' +
                                '-y ' + result[i].hotspotY + ' ' +
                                '-f ./'+cur_output_path+fileName + '.cur \n';

              // Begin creating script for hotpots used in icon conversion
              fs.appendFile('icons2cursors.sh', hotspotCommand, function (err) {
                if(err) {
                  console.log(err);
                } else {
                  console.log('Appended hotspot command: \''+hotspotCommand+'\' to \'ico2curHotspots.sh\' script.');
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