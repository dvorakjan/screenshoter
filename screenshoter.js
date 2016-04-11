var path = require('path'),
    mime = require('mime'),
    http = require('http'),
    url  = require('url'),
    fs   = require('fs'),
    exec = require('child_process').exec,
    sha1 = require('sha1'),
    program = require('commander');

program
  .version('0.0.1')
  .option('-p, --port <n>', 'Set listen port', parseInt)
  .option('-s, --ignore-ssl-errors', 'Ignore ssl errors')
  .parse(process.argv);

if (!fs.existsSync(__dirname+'/temp/')) {
  fs.mkdir(__dirname+'/temp/');
}

http.createServer(function(request, res){
  var urlParts = url.parse(request.url, true);

  if (urlParts.query.url) { 
    var filetype = urlParts.query.type ? urlParts.query.type : 'png';
    var size     = urlParts.query.size ? ' '+urlParts.query.size : '';
    var fileName = sha1(urlParts.query.url)+'.'+filetype;
    var phantomParams = (program.ignoreSslErrors) ? '--ssl-protocol=tlsv1 --ignore-ssl-errors=yes' : '--ssl-protocol=tlsv1';
    var cmd = 'phantomjs '+phantomParams+' rasterize.js '+urlParts.query.url+' temp/'+fileName+size;
    var phantom = exec(cmd, function (error, stdout, stderr) {
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
          console.log(stdout, stderr);
          res.writeHead(500);
          res.end('Chyba behem snimani obrazu pozadovane stranky.');
        }
    });
  } else {
    res.writeHead(500);
    res.end('Nenalezen parametr url.');
  }


  
}).listen(program.port || 9001);
console.log('Page capture server running on port '+(program.port   || 9001));
if (program.ignoreSslErrors) console.log('WARNING: SSL check disabled.');
