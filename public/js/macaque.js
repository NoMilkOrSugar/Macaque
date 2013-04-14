/*!
 * Macaque (client)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

Macaque = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// enable History API (requires catch-all route on server)
Macaque.Router.reopen({ location: 'history' });

Macaque.Store = DS.Store.extend({
  revision: 12
});

Macaque.List = DS.Model.extend({
    name     : DS.attr('string'),
    created  : DS.attr('date'),
    modified : DS.attr('date'),
    hidden   : DS.attr('boolean'),
    tasks    : DS.hasMany('Macaque.Task')
});

Macaque.Task = DS.Model.extend({
    text      : DS.attr('string'),
    created   : DS.attr('date'),
    modified  : DS.attr('date'),
    completed : DS.attr('boolean'),
    hidden    : DS.attr('boolean'),
    lists     : DS.hasMany('Macaque.List')
});

DS.RESTAdapter.configure('plurals', {
    list: 'lists',
    task: 'tasks'
});

DS.RESTAdapter.reopen({
    namespace: 'api'
});

Macaque.Router.map(function()
{
    this.route('about', { path: '/about' });

    this.resource('list', { path: '/list/:id' }, function() {
        this.route('edit', { path: '/edit' });
    });

    this.resource('task', { path: '/task/:id'}, function() {
        this.route('edit', { path: '/edit' });
    });
});

/* ==========================================================================
   Application
   ========================================================================== */

Macaque.ApplicationRoute = Ember.Route.extend({

    setupController: function(controller)
    {
        controller.set('title', 'Macaque');
    }
});

Macaque.ApplicationController = Ember.Controller.extend({

});

/* ==========================================================================
   Index
   ========================================================================== */

Macaque.IndexRoute = Ember.Route.extend({

    model: function()
    {
        return Macaque.List.find();
    }
});

/* ==========================================================================
   List
   ========================================================================== */

Macaque.ListView = Ember.View.extend({

    classNames: ['list-view']

});

Macaque.ListRoute = Ember.Route.extend({

    serialize: function(model)
    {
        return {
            id: model.get('id')
        };
    },

    model: function(params)
    {
        return Macaque.List.find(params.id);
    },

    setupController: function(controller, model)
    {

    }
});

Macaque.ListController = Ember.ObjectController.extend({

});

/* ==========================================================================
   Task
   ========================================================================== */

Macaque.TaskView = Ember.View.extend({

    classNames: ['task-view']

});

Macaque.TaskRoute = Ember.Route.extend({

    serialize: function(model)
    {
        return {
            id: model.get('id')
        };
    },

    model: function(params)
    {
        return Macaque.Task.find(params.id);
    },

    setupController: function(controller, model)
    {

    }
});

Macaque.TaskController = Ember.ObjectController.extend({

});
