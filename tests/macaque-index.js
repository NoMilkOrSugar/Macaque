/*!
 * Macaque (test)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

// fixed Zombie error:
// (node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
// https://github.com/assaf/zombie/issues/487#issuecomment-16017354

var Browser = require('zombie'),
    assert = require('assert');

describe('Visit Index', function()
{
    it('should load page with title "Macaque"', function(done)
    {
        var browser = new Browser();
        browser.visit('http://localhost:3000/tasks', { silent: true }, function()
        {
            assert.ok(browser.success);
            assert.equal('Macaque', browser.text('title'));
            done();
        });
    });
});
