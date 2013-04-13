/*!
 * Macaque (server)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var express = require('express'),
    http    = require('http'),
    path    = require('path'),
    url     = require('url'),
    data    = require('./macaque/macaque-data');

var app = express();

app.set('port', 3000);
app.set('title', 'Macaque');
app.set('version', 'v0.0.1');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));
// app.use(express.compress());
// app.use(app.router);

app.use(function(req, res, next)
{
    // remove trailing slash for API requests
    if (req.method === 'GET') {
        var req_url = url.parse(req.url);
        if (req_url.pathname.length > 1) {
            if (/^\/api/.test(req_url.pathname) && /\/$/.test(req_url.pathname)) {
                res.writeHead(301, { 'Location': req_url.pathname.replace(/\/$/, '') + (req_url.search ? req_url.search : '') });
                res.end();
                return;
            }
        }
    }
    next();
});

/* ==========================================================================
   Macaque API
   ========================================================================== */

// retrieve API version
app.get('/api', function(req, res)
{
    res.send({
        'version': app.get('version')
    });
});

// retrieve all lists
app.get('/api/lists', data.getLists);

// retrieve a specific list by its `id`
app.get('/api/lists/:id', data.getList);

// create a new list
app.post('/api/lists', data.addList);

// update a specific list by its `id`
app.put('/api/lists/:id', data.updateList);

// delete a specific list by its `id`
app.delete('/api/lists/:id', data.deleteList);


/* ==========================================================================
   Macaque
   ========================================================================== */

// catch everything else for routing in Ember
app.get('/*', function(req, res)
{
    res.render('index', {
        title: app.get('title')
    });
});

// open MongoDB
data.openDb('macaque');

http.createServer(app).listen(app.get('port'), function()
{
    console.log(app.get('title') + ' listening on port ' + app.get('port'));

    // run Mocha tests for Macaque API
    require('child_process').spawn('./node_modules/.bin/mocha', ['--reporter', 'Spec', './tests/macaque-api.js'], { stdio: 'inherit' });
});
