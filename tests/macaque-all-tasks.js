/*!
 * Macaque (test)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

var Browser = require('zombie'),
    assert = require('assert');

describe('Visit All Tasks', function()
{
    var browser;

    before(function(done)
    {

        browser = new Browser();
        browser.visit('http://localhost:3000/tasks', { silent: true }, function()
        {
            assert.ok(browser.success);

            browser.wait(function(window) {
                return window.document.querySelector('.view__title');
            }, done);
        });
    });

    it('should visit page with view title "All Tasks"', function(done)
    {
        assert.equal(true, /^All Tasks/.test(browser.document.querySelector('.view__title').innerHTML));
        done();
    });
});
