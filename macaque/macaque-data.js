/*!
 * Macaque
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var fs = require('fs'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;

var validateString = function(val)
{
    return (typeof val === 'string' && val.length > 0);
};

var listSchema = mongoose.Schema({
    'name'      : { 'type': String, 'default': 'Untitled', validate: validateString },
    'created'   : { 'type': Date, 'default': Date.now },
    'modified'  : { 'type': Date, 'default': Date.now },
    'is_hidden' : { 'type': Boolean, 'default': false },
    'task_ids'  : [{ 'type': ObjectId, ref: 'TaskModel' }]
});

listSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

listSchema.set('toJSON', {
    virtuals: true
});

var taskSchema = mongoose.Schema({
    'text'        : { 'type': String, 'default': 'Untitled', validate: validateString },
    'created'     : { 'type': Date, 'default': Date.now },
    'modified'    : { 'type': Date, 'default': Date.now },
    'is_complete' : { 'type': Boolean, 'default': false },
    'is_hidden'   : { 'type': Boolean, 'default': false },
    'list_ids'    : [{ 'type': ObjectId, ref: 'ListModel' }]
});

taskSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

taskSchema.set('toJSON', {
    virtuals: true
});

var ListModel = mongoose.model('ListModel', listSchema);
var TaskModel = mongoose.model('TaskModel', taskSchema);

var db;

exports.openDb = function(path, name)
{
    mongoose.connect(path + name);
    db = mongoose.connection;
    db.once('open', function()
    {
        console.log('Connected to database "' + name + '"');
    });
};

var onError = function(res, err)
{
    if (res) res.send({ 'error': err.message });
};

var onSuccess = function(res, data)
{
    if (!res) return;

    if (data) {
        res.send(data);
    } else {
        res.send({ 'success': true });
    }
};

/* ==========================================================================
   Export / Import Data
   ========================================================================== */

function getData(callback)
{
    ListModel.find({}, function(err, lists) {
        if (err) return callback(null);
        TaskModel.find({}, function(err, tasks) {
            if (err) return callback(null);
            return callback({ 'lists': lists, 'tasks': tasks });
        });
    });
}

function getBackups(dir)
{
    var ret = [], files = fs.readdirSync(dir);
    if (Array.isArray(files)) {
        files = files.sort(function(a, b) {
            return fs.statSync(dir + a).mtime.getTime() - fs.statSync(dir + b).mtime.getTime();
        });
        files.forEach(function(file) {
            if (/^\.macaque-/.test(file)) {
                ret.push(file);
            }
        });
    }
    return ret;
}

exports.exportJSON = function(req, res)
{
    getData(function(data) {
        if (!data) return onError(res, new Error('export failed'));
        onSuccess(res, data);
    });
};

exports.exportBackup = function(app, req, res)
{
    getData(function(data)
    {
        var dir = app.get('backup dir');

        if (!dir) return onError(res, new Error('no backup directory configured'));
        if (!data) return onError(res, new Error('no backup data exported'));

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.open(dir + '/.macaque-' + new Date().getTime(), 'w', function(err, fd)
        {
            if (err) return callback(err);

            buffer = new Buffer(JSON.stringify(data));
            fs.writeSync(fd, buffer, 0, buffer.length);

            onSuccess(res);

            var count = 0, files = getBackups(dir);
            files.reverse().forEach(function(file) {
                if (++count > (parseInt(app.get('backup limit'), 10) || 10)) {
                    if (fs.existsSync(dir + file)) fs.unlinkSync(dir + file);
                }
            });
        });
    });
};

exports.importBackup = function(app, req, res)
{
    var json, file, dir = app.get('backup dir');
    if (!dir) return onError(res, new Error('no backup directory configured'));

    file = getBackups(dir).pop();
    if (!file) return onError(res, new Error('no backup files found'));

    fs.readFile(dir + file, 'utf8', function (err, data)
    {
        if (err) return onError(res, err);
        try { json = JSON.parse(data); }
        catch(e) { return onError(res, e); }

        ListModel.remove({}).exec();
        TaskModel.remove({}).exec();

        if (Array.isArray(json.lists)) {
            json.lists.forEach(function(list) { new ListModel(list).save(); });
        }

        if (Array.isArray(json.tasks)) {
            json.tasks.forEach(function(task) { new TaskModel(task).save(); });
        }

        onSuccess(res);
    });
};

/* ==========================================================================
   Lists API
   ========================================================================== */

exports.findLists = function(req, res)
{
    var query = { 'is_hidden': false };
    if (Array.isArray(req.query.ids)) {
        query['_id'] = { $in: req.query.ids };
    }
    ListModel.find(query, function(err, lists) {
        if (err) return onError(res, err);
        onSuccess(res, { 'lists': lists });
    });
};

exports.findList = function(req, res)
{
    ListModel.find({ '_id': req.params.id }, function(err, list) {
        if (err) return onError(res, err);
        var query = { 'is_hidden': false, 'list_ids': { $in: [req.params.id] }};
        TaskModel.find(query, function(err, tasks) {
            if (!err) {
                onSuccess(res, { 'list': list[0], 'tasks': tasks });
            } else {
                onSuccess(res, { 'list': list[0] });
            }
        });
    });
};

exports.addList = function(req, res)
{
    var list = new ListModel(req.body.list);
    list.save(function(err) {
        if (err) return onError(res, err);
        onSuccess(res, { 'list': list });
    });
};

var updateList = function(id, doc)
{
    doc.modified = new Date();
    var list = ListModel.findByIdAndUpdate(req.params.id, doc, function(err, list) {
        if (err) return onError(res, err);
        onSuccess(res, { 'list': list });
    });
};

exports.updateList  = function(req, res)
{
    var doc = req.body.list;
    doc.modified = new Date();
    var list = ListModel.findByIdAndUpdate(req.params.id, doc, function(err, list) {
        if (err) return onError(res, err);
        onSuccess(res, { 'list': list });
    });
};

exports.deleteList = function(req, res)
{
    var list_id = req.params.id;
    ListModel.remove({ '_id': list_id }, function(err) {
        if (err) return onError(res, err);
        TaskModel.find({'list_ids': { $in: [list_id] }}, function(err, tasks) {
            if (err || !tasks.length) onSuccess(res, { 'list': null });
            tasks.forEach(function(task) {
                task.list_ids.remove(list_id);
                task.save();
            });
            onSuccess(res, { 'list': null });
        });
    });
};

/* ==========================================================================
   Tasks API
   ========================================================================== */

exports.findTasks = function(req, res)
{
    var query = { 'is_hidden': false };
    if (Array.isArray(req.query.ids)) {
        query['_id'] = { $in: req.query.ids };
    }
    TaskModel.find(query, function(err, tasks) {
        if (err) return onError(res, err);
        onSuccess(res, { 'tasks': tasks });
    });
};

exports.findTask = function(req, res)
{
    TaskModel.find({ '_id': req.params.id }, function(err, task) {
        if (err) return onError(res, err);
        if (!task.length || !task[0].list_ids) {
            onSuccess(res, { 'task': task[0] });
            return;
        }
        ListModel.find({ 'is_hidden': false, '_id': { $in: task[0].list_ids }}, function(err, lists) {
            if (!err) {
                onSuccess(res, { 'task': task[0], 'lists': lists });
            } else {
                onSuccess(res, { 'task': task[0] });
            }
        });
    });
};

exports.addTask = function(req, res)
{
    var task = new TaskModel(req.body.task);

    // list id passed by Ember
    var init_list = req.body.task.list;
    if (init_list) {
        task.list_ids.push(req.body.task.list);
    }

    task.save(function(err) {
        if (err) return onError(res, err);
        if (init_list) {
            var list = ListModel.findOne({ '_id': init_list }, function(err, list) {
                if (err) return;
                list.task_ids.push(task._id);
                list.save();
            });
        }
        onSuccess(res, { 'task': task });
    });
};

exports.updateTask  = function(req, res)
{
    var doc = req.body.task;
    doc.modified = new Date();
    var task = TaskModel.findByIdAndUpdate(req.params.id, doc, function(err, task) {
        if (err) return onError(res, err);
        onSuccess(res, { 'task': task });
    });
};

exports.deleteTask = function(req, res)
{
    var task_id =req.params.id;
    TaskModel.remove({ '_id': task_id }, function(err) {
        if (err) return onError(res, err);
        ListModel.find({ 'task_ids': { $in: [task_id] }}, function(err, lists) {
            if (err || !lists.length) onSuccess(res, { 'task': null });
            lists.forEach(function(list) {
                list.task_ids.remove(task_id);
                list.save();
            });
            onSuccess(res, { 'task': null });
        });
    });
};

/* ==========================================================================
   Data Fixtures
   ========================================================================== */

exports.resetFixtures = function()
{
    TaskModel.remove({}).exec();
    ListModel.remove({}).exec();

    var docs = [
        { name: 'Primates' },
        { name: 'Apes' },
        { name: 'Monkeys' },
        { name: 'New World Monkeys' },
        { name: 'Old World Monkeys' }
    ];

    ListModel.create(docs, function(err, primates, apes, monkeys, new_world, old_world)
    {
        if (err) return;

        docs = [
            { text: 'Lemurs', list_ids: [ primates._id ] },
            { text: 'Lorises', list_ids: [ primates._id ] },
            { text: 'Tarsiers', list_ids: [ primates._id ] },

            { text: 'Chimpanzees', list_ids: [ primates._id, apes._id ] },
            { text: 'Gibbons', list_ids: [ primates._id, apes._id ] },
            { text: 'Gorillas', list_ids: [ primates._id, apes._id ] },
            { text: 'Orangutans', list_ids: [ primates._id, apes._id ] },

            { text: 'Capuchins', list_ids: [ primates._id, monkeys._id, new_world._id ] },
            { text: 'Howler Monkeys', list_ids: [ primates._id, monkeys._id, new_world._id ] },
            { text: 'Marmosets', list_ids: [ primates._id, monkeys._id, new_world._id ] },

            { text: 'Colobus', list_ids: [ primates._id, monkeys._id, old_world._id] },
            { text: 'Baboons', list_ids: [ primates._id, monkeys._id, old_world._id] },
            { text: 'Macaques', list_ids: [ primates._id, monkeys._id, old_world._id] }
        ];

        TaskModel.create(docs, function(err) {

            ListModel.find({}, function(err, lists)
            {
                if (err) return;
                lists.forEach(function(list)
                {
                    TaskModel.find({ 'list_ids': { $in: [list.id] }}, function(err, tasks) {
                        tasks.forEach(function(task)
                        {
                            list.task_ids.push(task._id);
                        });
                        list.save();
                    });
                });
            });
        });
    });
};
