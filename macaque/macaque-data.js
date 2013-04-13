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
    'deleted'  : { 'type': Boolean, 'default': false }
});

var taskSchema = mongoose.Schema({
    'text'     : { 'type': String, 'default': 'Untitled', validate: validateString },
    'created'  : { 'type': Date, 'default': Date.now },
    'modified' : { 'type': Date, 'default': Date.now },
    'deleted'  : { 'type': Boolean, 'default': false },
    'lists'    : [ObjectId]
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
        res.send({ 'success': true, 'data': data });
    } else {
        res.send({ 'success': true });
    }
};

/* ==========================================================================
   Lists API
   ========================================================================== */

exports.findLists = function(req, res)
{
    ListModel.find({}, function(err, lists) {
        if (err) return onError(res, err);
        onSuccess(res, lists);
    });
};

exports.findList = function(req, res)
{
    ListModel.find({ '_id': req.params.id }, function(err, list) {
        if (err) return onError(res, err);
        onSuccess(res, list[0]);
    });
};

exports.addList = function(req, res)
{
    var list = new ListModel(req.body);
    list.save(function(err) {
        if (err) return onError(res, err);
        onSuccess(res, list);
    });
};

exports.updateList  = function(req, res)
{
    var list = ListModel.findByIdAndUpdate(req.params.id, req.body, function(err, list) {
        if (err) return onError(res, err);
        onSuccess(res, list);
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
    var query = { };
    if (req.query.list) {
        query.lists = { $in: [req.query.list] };
    }
    TaskModel.find(query, function(err, tasks) {
        if (err) return onError(res, err);
        onSuccess(res, tasks);
    });
};

exports.findTask = function(req, res)
{
    TaskModel.find({ '_id': req.params.id }, function(err, task) {
        if (err) return onError(res, err);
        onSuccess(res, task[0]);
    });
};

exports.addTask = function(req, res)
{
    var task = new TaskModel(req.body);
    task.save(function(err) {
        if (err) return onError(res, err);
        onSuccess(res, task);
    });
};

exports.updateTask  = function(req, res)
{
    var task = TaskModel.findByIdAndUpdate(req.params.id, req.body, function(err, task) {
        if (err) return onError(res, err);
        onSuccess(res, task);
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
            { text: 'Lemurs', lists: [ primates._id ] },
            { text: 'Lorises', lists: [ primates._id ] },
            { text: 'Tarsiers', lists: [ primates._id ] },

            { text: 'Chimpanzees', lists: [ primates._id, apes._id ] },
            { text: 'Gibbons', lists: [ primates._id, apes._id ] },
            { text: 'Gorillas', lists: [ primates._id, apes._id ] },
            { text: 'Orangutans', lists: [ primates._id, apes._id ] },

            { text: 'Capuchins', lists: [ primates._id, monkeys._id, new_world._id ] },
            { text: 'Howler Monkeys', lists: [ primates._id, monkeys._id, new_world._id ] },
            { text: 'Marmosets', lists: [ primates._id, monkeys._id, new_world._id ] },

            { text: 'Colobus', lists: [ primates._id, monkeys._id, old_world._id] },
            { text: 'Baboons', lists: [ primates._id, monkeys._id, old_world._id] },
            { text: 'Macaques', lists: [ primates._id, monkeys._id, old_world._id] }
        ];

        TaskModel.create(docs, function(err) {
            if (!err) console.log('Fixtures loaded');
        });
    });
};
