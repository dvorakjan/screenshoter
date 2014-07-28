var path = require('path'),
    mime = require('mime'),
    http = require('http'),
    url  = require('url'),
    fs   = require('fs'),
    exec = require('child_process').exec,
    sha1 = require('sha1');


if (!fs.existsSync(__dirname+'/temp/')) {
  fs.mkdir(__dirname+'/temp/');
}

http.createServer(function(request, res){
  var urlParts = url.parse(request.url, true);

  if (urlParts.query.url) {
    var fileName = sha1(urlParts.query.url)+'.png';
    var phantom = exec('phantomjs rasterize.js '+urlParts.query.url+' temp/'+fileName, function (error, stdout, stderr) {
        if (stdout.indexOf('Crop to') > -1) {
          var file = __dirname + '/temp/' + fileName;
          if (fs.existsSync(file)) {

            var filename = path.basename(file);
            var mimetype = mime.lookup(file);

            res.setHeader('Content-type', mimetype);
            if (typeof urlParts.query.download !== 'undefined')
              res.setHeader('Content-disposition', 'attachment; filename=' + urlParts.query.url.replace('http://','').replace('.','-'));
            

            var filestream = fs.createReadStream(file).on('end', function() {
              //fs.unlinkSync(file);
            });
            filestream.pipe(res);
          } else {
            res.writeHead(500);
            res.end('Nepovedlo se sejmou obraz pozadovane stranky.');
          }
        } else {
          res.writeHead(500);
          res.end('Chyba behem snimani obrazu pozadovane stranky.');
        }
    });
  } else {
    res.writeHead(500);
    res.end('Nenalezen parametr url.');
  }


  
}).listen(9001);
console.log('Page capture server running on port 9001');
