/*!
 * Macaque (client)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

Macaque = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// Macaque.Router.reopen({
//     location: 'history'
// });

Macaque.Router.map(function()
{
    this.route('about', { path: '/about' });

    this.resource('category', { path: '/category/:category_id' }, function()
    {
        this.resource('task', { path: '/:task_id' });
    });
});

/**
 * Macaque.Application
 *
 */

Macaque.ApplicationRoute = Ember.Route.extend({

    setupController: function(controller)
    {
        controller.set('title', 'Macaque');
    }
});

Macaque.ApplicationController = Ember.Controller.extend({

});

/**
 * Macaque.Index
 *
 */

Macaque.IndexRoute = Ember.Route.extend({

    redirect: function()
    {
        this.transitionTo('category', Macaque.Category.find('all'));
    }
});

/**
 * Macaque.Category
 *
 */

Macaque.Category = Ember.Object.extend({

    loaded: false,

    loadTasks: function()
    {
        if (this.get('loaded')) {
            return;
        }
        var category = this;
        $.getJSON('/api/category/' + category.get('id')).then(function(response)
        {
            var tasks = Em.A();
            if (response.success) {
                response.tasks.forEach(function(item) {
                    tasks.push(Macaque.Task.find(item.id, item));
                });
            }
            category.setProperties({
                tasks: tasks,
                loaded: true
            });
        });
    }
});

Macaque.CategoryView = Ember.View.extend({

    classNames: ['category-view']

});

Macaque.Category.reopenClass({

    store: { },

    find: function(id)
    {
        if (!this.store[id]) {
            this.store[id] = Macaque.Category.create({ id: id });
        }
        return this.store[id];
    }
});

Macaque.CategoryRoute = Ember.Route.extend({

    serialize: function(model)
    {
        return {
            category_id: model.get('id')
        };
    },

    model: function(params)
    {
        return Macaque.Category.find(params.category_id);
    },

    setupController: function(controller, model)
    {
        model.loadTasks();
    }
});

Macaque.CategoryController = Ember.ObjectController.extend({

});

/**
 * Macaque.Item
 *
 */

Macaque.Task = Ember.Object.extend({
    id: null,
    text: 'Untitled',
    created: new Date(),
    done: false
});

Macaque.Task.reopenClass({

    store: { },

    find: function(id, item)
    {
        if (item) {
            this.store[id] = Macaque.Task.create(item);
        } else {
            if (!this.store[id]) {
                this.store[id] = Macaque.Task.create({ id: id });
            }
        }
        return this.store[id];
    }
});

Macaque.TaskView = Ember.View.extend({

    classNames: ['task-view']

});

Macaque.TaskRoute = Ember.Route.extend({

    serialize: function(model)
    {
        return {
            task_id: model.id
        };
    },

    model: function(params)
    {
        return Macaque.Task.find(params.task_id);
    },

    setupController: function(controller, model)
    {
        // load individual task
    }/*,

    renderTemplate: function()
    {
        this.render({
            into: 'application'
        });
    }*/
});

Macaque.TaskController = Ember.ObjectController.extend({

    needs: ['category']
});
