/*!
 * Macaque
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var mongo = require('mongodb');

var db, server = new mongo.Server('localhost', 27017, { auto_reconnect: true });

/**
 * open database
 */
exports.openDb = function(name)
{
    db = new mongo.Db(name, server, { w: 1 });
    db.open(function(err, db)
    {
        if (!err) {
            console.log('Connected to database "' + name + '"');
        }
    });
};

var onError = function(res, err)
{
    res.send({ 'error': err.message });
};

var onSuccess = function(res, data)
{
    res.send({ 'success': true, 'data': data });
};

/**
 * retrieve all lists
 */
exports.getLists = function(req, res)
{
    db.collection('lists', function(err, collection)
    {
        if (err) return onError(res, err);
        collection.find().toArray(function(err, items)
        {
            if (err) return onError(res, err);
            onSuccess(res, items);
        });
    });
};

/**
 * retrieve a specific list by `_id`
 */
exports.getList = function(req, res)
{
    var id = req.params.id;
    db.collection('lists', function(err, collection)
    {
        if (err) return onError(res, err);
        collection.findOne({ '_id': new mongo.BSONPure.ObjectID(id) }, function(err, item)
        {
            if (err) return onError(res, err);
            onSuccess(res, item);
        });
    });
};

/**
 * create a new list
 */
exports.addList = function(req, res)
{
    var list = req.body;

    if (typeof list.name !== 'string') {
        return onError(res, new Error('List \'name\' property required'));
    }

    db.collection('lists', function(err, collection)
    {
        if (err) return onError(res, err);
        collection.insert(list, { safe: true }, function(err, result)
        {
            if (err) return onError(res, err);
            onSuccess(res, result[0]);
        });
    });
};

/**
 * update a specific list by `_id`
 */
exports.updateList  = function(req, res)
{
    var id = req.params.id;
    var list = req.body;
    db.collection('lists', function(err, collection)
    {
        if (err) return onError(res, err);
        collection.update({ '_id': new mongo.BSONPure.ObjectID(id) }, list, { safe: true }, function(err, result)
            {
                if (err) return onError(res, err);
                onSuccess(res, result[0]);
            });
    });
};

/**
 * delete a specific list by `_id`
 */
exports.deleteList = function(req, res)
{
    var id = req.params.id;
    db.collection('lists', function(err, collection)
    {
        if (err) return onError(res, err);
        collection.remove({ '_id': new mongo.BSONPure.ObjectID(id) }, { safe: true }, function(err, result)
        {
            if (err) return onError(res, err);
            onSuccess(res, result[0]);
        });
    });
};
