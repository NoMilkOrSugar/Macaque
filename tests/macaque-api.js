/*!
 * Macaque (test)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var http = require('http'),
    assert = require('assert');

var macaqueAPI = function(path, onData, method, data)
{
    method = method || 'GET';

    var req, callback = function(res)
    {
        if (res.statusCode !== 200) {
            throw new Error('Unexpected HTTP statusCode ' + res.statusCode);
        }
        res.setEncoding('utf8');
        res.on('data', onData);
    };

    var body, options = {
        host: 'localhost',
        port: 3000,
        path: path,
        method: method || 'GET'
    };

    if (data) {
        body = JSON.stringify(data);
        options.headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': body.length
        };
    }

    req = http.request(options, callback);
    req.on('error', function(e) { throw e; });
    req.end(body);
};

describe('Macaque API', function()
{
    it('should return a version number', function(done)
    {
        macaqueAPI('/api', function(data)
        {
            var json = JSON.parse(data);
            assert.equal('v', json.version.charAt(0));
            done();
        });
    });

    describe('Lists', function()
    {
        it('should return an array of lists', function(done)
        {
            macaqueAPI('/api/lists', function(data)
            {
                var json = JSON.parse(data);
                assert.equal(true, Array.isArray(json.lists));
                assert.equal(false, isNaN(json.lists.length));
                done();
            });
        });

        it('should return a list with a name property', function(done)
        {
            macaqueAPI('/api/lists', function(data)
            {
                var list = JSON.parse(data).lists[0];
                macaqueAPI('/api/lists/' + list.id, function(data)
                {
                    var json = JSON.parse(data);
                    assert.equal(true, typeof json.list === 'object');
                    assert.equal(true, typeof json.list.name === 'string');
                    done();
                });
            });
        });

        it('should fail to add new list with no name', function(done)
        {
            macaqueAPI('/api/lists', function(data)
            {
                var json = JSON.parse(data);
                assert.equal(true, typeof json.error === 'string');
                done();
            }, 'POST', { 'name': null });
        });

        it('should add and remove a new list', function(done)
        {
            var json, name = 'test ' + new Date().getTime();
            macaqueAPI('/api/lists', function(data)
            {
                json = JSON.parse(data);
                assert.equal(true, typeof json.list === 'object');
                assert.equal(true, json.list.name === name);
                macaqueAPI('/api/lists/' + json.list.id, function(data)
                {
                    json = JSON.parse(data);
                    assert.equal(true, json.success);
                    done();
                }, 'DELETE');
            }, 'POST', { 'name': name });
        });

        it('should add, edit, and remove a new list', function(done)
        {
            var list, json, name  = 'test ' + new Date().getTime();
            macaqueAPI('/api/lists', function(data)
            {
                json = JSON.parse(data);
                list = json.list;
                assert.equal(true, typeof list === 'object');
                assert.equal(true, list.name === name);
                macaqueAPI('/api/lists/' + list.id, function(data)
                {
                    json = JSON.parse(data);
                    assert.equal(true, typeof json.list === 'object');
                    assert.equal(true, json.list.name === name + '_edit');
                    macaqueAPI('/api/lists/' + list.id, function(data)
                    {
                        json = JSON.parse(data);
                        assert.equal(true, json.success);
                        done();
                    }, 'DELETE');
                }, 'PUT', { 'name': name + '_edit' });
            }, 'POST', { 'name': name });
        });

    }); // Lists

    describe('Tasks', function()
    {
        it('should return an array of tasks', function(done)
        {
            macaqueAPI('/api/tasks', function(data)
            {
                var json = JSON.parse(data);
                assert.equal(true, Array.isArray(json.tasks));
                assert.equal(false, isNaN(json.tasks.length));
                done();
            });
        });

        it('should return a task with a text property', function(done)
        {
            macaqueAPI('/api/tasks', function(data)
            {
                var task = JSON.parse(data).tasks[0];
                macaqueAPI('/api/tasks/' + task.id, function(data)
                {
                    var json = JSON.parse(data);
                    assert.equal(true, typeof json.task === 'object');
                    assert.equal(true, typeof json.task.text === 'string');
                    done();
                });
            });
        });

        it('should fail to add new task with no text', function(done)
        {
            macaqueAPI('/api/tasks', function(data)
            {
                var json = JSON.parse(data);
                assert.equal(true, typeof json.error === 'string');
                done();
            }, 'POST', { 'text': null });
        });

        it('should add and remove a new task', function(done)
        {
            var json, text = 'test ' + new Date().getTime();
            macaqueAPI('/api/tasks', function(data)
            {
                json = JSON.parse(data);
                assert.equal(true, typeof json.task === 'object');
                assert.equal(true, json.task.text === text);
                macaqueAPI('/api/tasks/' + json.task.id, function(data)
                {
                    json = JSON.parse(data);
                    assert.equal(true, json.success);
                    done();
                }, 'DELETE');
            }, 'POST', { 'text': text });
        });


        it('should add and remove a new task within a list', function(done)
        {
            macaqueAPI('/api/lists', function(data)
            {
                var json = JSON.parse(data),
                    list = json.lists[0],
                    text = 'test ' + new Date().getTime();
                macaqueAPI('/api/tasks', function(data)
                {
                    json = JSON.parse(data);
                    assert.equal(true, json.task.text === text);
                    assert.equal(true, json.task.list_ids[0] === list._id);
                    macaqueAPI('/api/tasks/' + json.task.id, function(data)
                    {
                        json = JSON.parse(data);
                        assert.equal(true, json.success);
                        done();
                    }, 'DELETE');
                }, 'POST', { 'text': text, 'list_ids': [list.id] });
            });
        });

        it('should add, edit, and remove a new task', function(done)
        {
            var task, json, text  = 'test ' + new Date().getTime();
            macaqueAPI('/api/tasks', function(data)
            {
                json = JSON.parse(data);
                task = json.task;
                assert.equal(true, task.text === text);
                macaqueAPI('/api/tasks/' + task.id, function(data)
                {
                    json = JSON.parse(data);
                    assert.equal(true, json.task.id === task.id);
                    macaqueAPI('/api/tasks/' + task.id, function(data)
                    {
                        json = JSON.parse(data);
                        assert.equal(true, json.success);
                        done();
                    }, 'DELETE');
                }, 'PUT', { 'text': text + '_edit' });
            }, 'POST', { 'text': text });
        });

    }); // Tasks

});
