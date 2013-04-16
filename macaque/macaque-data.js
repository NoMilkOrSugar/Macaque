/*!
 * Macaque
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var mongo = require('mongodb'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;

var validateString = function(val)
{
    return (typeof val === 'string' && val.length > 0);
};

var listSchema = mongoose.Schema({
    'name'     : { 'type': String, 'default': 'Untitled', validate: validateString },
    'created'  : { 'type': Date, 'default': Date.now },
    'modified' : { 'type': Date, 'default': Date.now },
    'hidden'   : { 'type': Boolean, 'default': false },
    'task_ids' : [{ 'type': ObjectId, ref: 'TaskModel' }]
});

listSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

listSchema.set('toJSON', {
    virtuals: true
});

var taskSchema = mongoose.Schema({
    'text'      : { 'type': String, 'default': 'Untitled', validate: validateString },
    'created'   : { 'type': Date, 'default': Date.now },
    'modified'  : { 'type': Date, 'default': Date.now },
    'completed' : { 'type': Boolean, 'default': false },
    'hidden'    : { 'type': Boolean, 'default': false },
    'list_ids'  : [{ 'type': ObjectId, ref: 'ListModel' }]
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

exports.openDb = function(name)
{
    mongoose.connect('mongodb://localhost:27017/' + name);
    db = mongoose.connection;
    db.once('open', function()
    {
        console.log('Connected to database "' + name + '"');
    });
};

var onError = function(res, err)
{
    res.send({ 'error': err.message });
};

var onSuccess = function(res, data)
{
    if (data) {
        res.send(data);
    } else {
        res.send({ 'success': true });
    }
};

/* ==========================================================================
   Lists API
   ========================================================================== */

exports.findLists = function(req, res)
{
    var query = { 'hidden': false };
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
        TaskModel.find({ 'hidden': false, 'list_ids': { $in: [req.params.id] }}, function(err, tasks) {
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
    ListModel.remove({ '_id': req.params.id }, function(err) {
        if (err) return onError(res, err);
        onSuccess(res);
    });
};

/* ==========================================================================
   Tasks API
   ========================================================================== */

exports.findTasks = function(req, res)
{
    var query = { 'hidden': false };
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
        ListModel.find({ 'hidden': false, '_id': { $in: task[0].list_ids }}, function(err, lists) {
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
            var list = ListModel.findOne({ '_id': init_list }, function(err, list)
            {
                if (!err) {
                    list.task_ids.push(task._id);
                    list.save();
                }
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
    TaskModel.remove({ '_id': req.params.id }, function(err) {
        if (err) return onError(res, err);
        onSuccess(res);
    });
};

/* ==========================================================================
   Data Fixtures
   ========================================================================== */

exports.resetFixtures = function()
{
    TaskModel.find({}, function(err, docs) {
        if (!err) docs.forEach(function(doc) { doc.remove(); });
    });

    ListModel.find({}, function(err, docs) {
        if (!err) docs.forEach(function(doc) { doc.remove(); });
    });

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

            if (!err) console.log('Fixtures loaded');
        });
    });
};
