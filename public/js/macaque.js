/*!
 * Macaque (client)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

Ember.Handlebars.registerBoundHelper('fromNow', function(date)
{
    return moment(date).fromNow();
});

Macaque = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// enable History API (requires catch-all route on server)
Macaque.Router.reopen({ location: 'history' });

Macaque.Store = DS.Store.extend({
    revision: 12,
    adapter: DS.RESTAdapter.extend({
        url: 'http://localhost:3000'
    })
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

// DS.RESTAdapter.map('Macaque.Task', {
//   lists: { embedded: 'always' }
// });

DS.RESTAdapter.reopen({
    namespace: 'api'
});

Macaque.Router.map(function()
{
    // this.route('about', { path: '/about' });

    this.resource('list', { path: '/list/:id' }, function() {
        // this.route('edit', { path: '/edit' });
    });

    this.resource('task', { path: '/task/:id'}, function() {
        // this.route('edit', { path: '/edit' });
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
    },

    setupController: function(controller, model)
    {
        controller.set('lists', model);
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
        controller.set('content', model);
        controller.set('isEditing', false);
        controller.set('newTask', { text: 'Apple' });
    }
});

Macaque.ListController = Ember.ObjectController.extend({

    isEditing: false,

    edit: function()
    {
        this.set('isEditing', true);
    },

    save: function()
    {
        this.set('isEditing', false);
        this.get('store').commit();
    },

    actionToFire: function(e)
    {
        console.log('FIRE!');
        console.log(e.get('id'));
    },

    create: function()
    {
        var list = Macaque.List.find(this.content.id);

        var store = this.get('store');

        var task = Macaque.Task.createRecord(this.get('newTask'));
        // var task = list.get('tasks').createRecord(this.get('newTask'));

        task.set('created', new Date());
        task.set('modified', new Date());
        // task.get('lists').pushObject(list.id);
        // list.get('tasks').pushObject(task);

        task.one('didCreate', function(task)
        {
            console.log('didCreate:' + task.get('text'));
        });

        // https://github.com/emberjs/data/issues/405
        task.addObserver('id', function(task)
        {
            console.log('task id: ' + task.get('id'));
            // list.get('tasks').pushObject(Macaque.Task.find(task.id));

            // setTimeout(function() {
                // task.get('lists').pushObject(list);
                // task.get('transaction').commit();
            // }, 100);

            // task.addObserver('lists', function(task) {
            //     console.log('test!');
            // });
            // task.get('transaction').commit();
            // list.get('tasks').pushObject(task);
            // store.commit();
        });

        // store.commit();
        task.get('transaction').commit();


        // console.log(task);
    }
});

Macaque.TaskCreateView = Ember.View.extend({

    templateName: 'task-create',

    classNames: ['task-create-view'],

    click: function(e)
    {
        if (e.target.id === 'task-create-button') {
            field = document.getElementById('task-create-text');
            if (!field.value || /^\s*$/.test(field.value)) {
                return;
            }
            this.get('controller').send('create');
        }
    }
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
