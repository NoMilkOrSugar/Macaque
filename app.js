/*!
 * Macaque (server)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var express = require('express'),
    http    = require('http'),
    path    = require('path'),
    url     = require('url'),
    mdata   = require('./macaque/data');

var app = express();

app.set('port', 3000);
app.set('title', 'Macaque');
app.set('version', 'v0.0.1');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));
// app.use(app.router);

app.use(function(req, res, next)
{
    if (req.method === 'GET') {
        var req_url = url.parse(req.url);
        if (req_url.pathname.length > 1) {
            // remove trailing slash for API requests
            if (/^\/api/.test(req_url.pathname)) {
                if (/\/$/.test(req_url.pathname)) {
                    res.writeHead(301, { 'Location': req_url.pathname.replace(/\/$/, '') + (req_url.search ? req_url.search : '') });
                    res.end();
                    return;
                }
            } else {
                // res.writeHead(301, { 'Location': '/#' + req_url.href });
                // res.end();
                // return;
            }
        }
    }
    next();
});

app.get('/', function(req, res)
{
    res.render('index', {
        title: app.get('title')
    });
});

app.get('/api', function(req, res)
{
    res.send({
        'version': app.get('version')
    });
});

app.get('/api/category/all', function(req, res)
{
    res.send(mdata.tasksJSON);
});

app.get('/api/task/*', function(req, res)
{
    var id = parseInt(req.params[0], 10);
    if (isNaN(id) || id < 0 || id >= mdata.tasksJSON.tasks.length) {
        res.writeHead(404);
        res.end();
    } else {
        res.send({
            success: true,
            data: mdata.tasksJSON.tasks[id - 1]
        });
    }
});

http.createServer(app).listen(app.get('port'), function()
{
    console.log(app.get('title') + ' listening on port ' + app.get('port'));
});
