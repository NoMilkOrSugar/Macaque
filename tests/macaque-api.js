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

    it('should return an array of lists', function(done)
    {
        macaqueAPI('/api/lists', function(data)
        {
            var json = JSON.parse(data);
            assert.equal(true, json.success);
            assert.equal(true, Array.isArray(json.data));
            assert.equal(false, isNaN(json.data.length));
            done();
        });
    });

    it('should return a list with a name property', function(done)
    {
        macaqueAPI('/api/lists', function(data)
        {
            var list = JSON.parse(data).data[0];
            macaqueAPI('/api/lists/' + list._id, function(data)
            {
                var json = JSON.parse(data);
                assert.equal(true, json.success);
                assert.equal(true, typeof json.data === 'object');
                assert.equal(true, typeof json.data.name === 'string');
                done();
            });
        });
    });

    it('should fail to add new list with no name', function(done)
    {
        macaqueAPI('/api/lists', function(data)
        {
            var json = JSON.parse(data);
            assert.equal(true, json.error === 'List \'name\' property required');
            done();

        }, 'POST', { 'name': null });
    });

    it('should add and remove a new list', function(done)
    {
        var json, name = 'test ' + new Date().getTime();

        macaqueAPI('/api/lists', function(data)
        {
            json = JSON.parse(data);
            assert.equal(true, json.success);
            assert.equal(true, json.data.name === name);

            macaqueAPI('/api/lists/' + json.data._id, function(data)
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
            list = json.data;
            assert.equal(true, json.success);
            assert.equal(true, list.name === name);

            macaqueAPI('/api/lists/' + list._id, function(data)
            {
                json = JSON.parse(data);
                assert.equal(true, json.success);

                macaqueAPI('/api/lists/' + list._id, function(data)
                {
                    json = JSON.parse(data);
                    assert.equal(true, json.success);
                    done();

                }, 'DELETE');

            }, 'PUT', { 'name': name + '_edit' });

        }, 'POST', { 'name': name });
    });
});
