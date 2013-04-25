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

app.set('mongodb url', 'mongodb://localhost:27017/');
app.set('mongodb name', 'macaque');

// auto export/import MongoDB data
app.set('backup', true);
// relative directory in which to save backups
app.set('backup dir', '.macaque/');
// maximum number of backups to save before oldest is deleted
app.set('backup limit', 10);

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

var _backup = null;

function autoSaveBackup()
{
    if (app.get('backup')) {
        clearTimeout(_backup);
        _backup = setTimeout(function() {
            data.exportBackup(app, { query: { autosave: 1 }});
        }, 2000);
    }
}

// retrieve API version
app.get('/api', function(req, res)
{
    res.send({
        'version': app.get('version')
    });
});

// export and import
app.get('/api/import/fixtures', function(req, res)
{
    data.resetFixtures();
    res.send({ 'success': true });
});
app.get('/api/import/backup', function(req, res) { data.importBackup(app, req, res); });
app.get('/api/export/backup', function(req, res) { data.exportBackup(app, req, res); });
app.get('/api/export', data.exportJSON);

// list API paths
app.get('/api/lists', data.findLists);
app.get('/api/lists/:id', data.findList);
app.post('/api/lists', function(req, res) {
    data.addList(req, res);
    autoSaveBackup();
});
app.put('/api/lists/:id', function(req, res) {
    data.updateList(req, res);
    autoSaveBackup();
});
app.delete('/api/lists/:id', function(req, res) {
    data.deleteList(req, res);
    autoSaveBackup();
});

// task API paths
app.get('/api/tasks', data.findTasks);
app.get('/api/tasks/:id', data.findTask);
app.post('/api/tasks', function(req, res) {
    data.addTask(req, res);
    autoSaveBackup();
});
app.put('/api/tasks/:id', function(req, res) {
    data.updateTask(req, res);
    autoSaveBackup();
});
app.delete('/api/tasks/:id', function(req, res) {
    data.deleteTask(req, res);
    autoSaveBackup();
});


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
data.openDb(app.get('mongodb url'), app.get('mongodb name'));

var i, args = process.argv.splice(2);

// import data from backup
if ((i = args.indexOf('--backup')) !== -1) {
    if (app.get('backup')) {
        if (args.length > i + 1) {
            app.set('backup file', '.macaque-' + args[i + 1]);
        }
        data.importBackup(app);
    }
}

http.createServer(app).listen(app.get('port'), function()
{
    console.log(app.get('title') + ' listening on port ' + app.get('port'));

    // run Mocha tests for Macaque API
    // require('child_process').spawn('./node_modules/.bin/mocha', ['--reporter', 'Spec', './tests/mocha/macaque-api.js'], { stdio: 'inherit' });
});
