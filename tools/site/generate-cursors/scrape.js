var png_output_path = 'png-output';

var phantom=require('node-phantom');

phantom.create(function(err,ph) {
  
  return ph.createPage(function(err,page) {
    return page.open("./svgtest.html", function(err,status) {
      
      console.log("Loading SVGs into Canvas via PhantomJS? ", status);
        
        setTimeout(function() {
          return page.evaluate(function() {

            var dataURLS = document.getElementsByTagName('dataurl');

            var results = [];

            for(var i=0, l=dataURLS.length; i< l; i++){
              results.push({
                title: dataURLS[i].title,
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

            var regex = /^data:.+\/(.+);base64,(.*)$/
              , matches
              , ext
              , data
              , buffer
              , string
              ;

            for(; i< l; i++){

              fileName = result[i].title+'.png';
              console.log('Saving PNG: ' + fileName);
              dataURL=result[i].data;

              matches = dataURL.match(regex);
              ext = matches[1];
              data = matches[2];
              buffer = new Buffer(data, 'base64');            
              fs.writeFileSync( './'+png_output_path+'/'+fileName, buffer );
            }

            ph.exit();
          });

        }, 10000);

    });
  });
});