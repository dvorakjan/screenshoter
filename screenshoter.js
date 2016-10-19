var path = require('path'),
    mime = require('mime'),
    // http = require('http'),
    http = require('follow-redirects').http,
    // https = require('https'),
    https = require('follow-redirects').https,
    url = require('url'),
    fs = require('fs'),
    sha1 = require('sha1'),
    pdf = require('html-pdf'),
    program = require('commander');

program
    .version('0.1.0')
    .option('-p, --port <n>', 'Set listen port', parseInt)
    .option('-s, --ignore-ssl-errors', 'Ignore ssl errors')
    .parse(process.argv);

if (!fs.existsSync(__dirname + '/temp/')) {
    fs.mkdir(__dirname + '/temp/');
}


var screenOldWay = function (request, res, urlParts, fileType, body) {
    res.writeHead(500);
    res.end('fail');
};

var screenNewWay = function (request, res, urlParts, fileType, body) {

    var params = {};

    try {
        if (body != "") {
            var json = JSON.parse(body);
            if (typeof(json.transformParams) != 'undefined') {
                params = json.transformParams;
            }
        }
        params.type = fileType;
    } catch(e) {
        console.log(e);
        res.writeHead(500);
        res.end();
        return;
    }

    var htmlUrl = urlParts.query.url;
    var htmlUrlParts = url.parse(htmlUrl, true);

    var responseHandler = function (res2) {

        var html = '';
        res2.on('data', function (chunk2) {
            html += chunk2;
        });
        res2.on('end', function () {

            console.log(params);

            pdf.create(html, params).toStream(function(err, stream) {
                if (err) {
                    console.log(err);
                    res.writeHead(500);
                    res.end();
                } else {

                    if (fileType == 'jpeg') {
                        var contentType = 'image/jpeg';
                    } else if (fileType == 'pdf') {
                        contentType = 'application/pdf';
                    } else {
                        contentType = 'image/png';
                    }
                    res.setHeader('Content-type', contentType);
                    res.setHeader('Content-disposition', 'attachment; filename=' + htmlUrl.replace('http://','').replace('https://','').replace('.','-') + '.' + fileType);
                    stream.pipe(res);
                }
            });
        });
    };

    if (htmlUrlParts.protocol == 'https:') {
        var pdfRequest = https.get(htmlUrl, responseHandler);
    } else if (htmlUrlParts.protocol == 'http:') {
        pdfRequest = http.get(htmlUrl, responseHandler);
    } else {
        pdfRequest = null;
    }
    if (pdfRequest) {
        pdfRequest.on('error', function (e) {
            console.log(e.message);
            res.writeHead(500);
            res.end();
        });
    }

};


var server = function (request, res) {
    var body = "";
    request.on('data', function (chunk) {
        body += chunk;
    });
    request.on('end', function () {

        var urlParts = url.parse(request.url, true);

        if (typeof(urlParts.query.url) == 'undefined' || urlParts.query.url == '') {
            res.writeHead(500);
            res.end('Url parameter "url" is missing.');
            return;
        }

        var allowedFileTypes = ['png', 'jpeg', 'pdf'];
        if (urlParts.query.type && allowedFileTypes.indexOf(urlParts.query.type) >= 0) {
            var fileType = urlParts.query.type;
        } else {
            fileType = 'png';
        }

        if (typeof(urlParts.query.technology) != 'undefined' && urlParts.query.technology == 'new') {
            screenNewWay(request, res, urlParts, fileType, body);
        } else {
            screenOldWay(request, res, urlParts, fileType, body);
        }
    });
};

var port = program.port || 9001;
http.createServer(server).listen(port);
console.log('Page capture server running on port ' + port);
if (program.ignoreSslErrors) {
    console.log('WARNING: SSL check disabled.');
}
