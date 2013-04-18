/*!
 * Macaque (client)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

Ember.Handlebars.registerBoundHelper('fromNow', function(date) {
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
        // bulkCommit: true
    })
});

Macaque.List = DS.Model.extend({
    name     : DS.attr('string'),
    created  : DS.attr('date'),
    modified : DS.attr('date'),
    isHidden : DS.attr('boolean'),
    tasks    : DS.hasMany('Macaque.Task'),

    // computed properties not stored in database

    taskCount: function() {
        return this.get('tasks').get('length');
    }.property('tasks')
});

Macaque.Task = DS.Model.extend({
    text       : DS.attr('string'),
    created    : DS.attr('date'),
    modified   : DS.attr('date'),
    isComplete : DS.attr('boolean'),
    isHidden   : DS.attr('boolean'),
    lists      : DS.hasMany('Macaque.List'),

    // so we can pass the parent upon creation but return list_ids
    // the RESTAdapter doesnt seem to send or update hasMany relationships
    list      : DS.attr('string'),

    isCompleteChange: function () {
        Ember.run.once(this, function () {
            this.get('store').commit();
        });
    }.observes('isComplete')
});

DS.RESTAdapter.configure('plurals', {
    list: 'lists',
    task: 'tasks'
});

DS.RESTAdapter.reopen({
    namespace: 'api'
});

// DS.RESTAdapter.map(Macaque.List, {
//     tasks: { embedded: 'load' }
// });

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

    previousList: null

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
        // reset breadcrumb history
        this.controllerFor('application').set('previousList', null);
        controller.set('lists', model);
    }
});

Macaque.IndexController = Ember.Controller.extend({

});

/* ==========================================================================
   List
   ========================================================================== */

Macaque.ListView = Ember.View.extend({

    classNames: ['list-view'],

    click: function(e)
    {
        if ($(e.target).closest('#list-view-edit-button').length) {
            $('#list-view-edit-field').focus();
        }
    },

    keyDown: function(e)
    {
        console.log(e.keyCode);
        if (e.target.id === 'list-view-edit-field') {
            if ($.inArray(e.keyCode, [13, 27]) !== -1) {
              this.get('controller').send('endEdit');
            }
        }
    }

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
        // set breadcrumb history
        this.controllerFor('application').set('previousList', model);

        controller.set('content', model);
        controller.set('isEditing', false);
        controller.set('newTask', { text: '', 'list': model.id });
    },

    events: {

        edit: function()
        {
            this.get('controller').startEdit();
        }
    }
});

Macaque.ListController = Ember.ObjectController.extend({

    isEditing: false,

    startEdit: function()
    {
        this.set('isEditing', true);
    },

    endEdit: function()
    {
        this.set('isEditing', false);
        this.get('store').commit();
    },

    create: function()
    {
        var list = Macaque.List.find(this.get('content').id),
            task = Macaque.Task.createRecord(this.get('newTask'));

        task.set('created', new Date());
        task.set('modified', new Date());

        // https://github.com/emberjs/data/issues/405
        // http://stackoverflow.com/questions/15624193/many-to-many-relationships-with-ember-ember-data-and-rails
        // https://gist.github.com/stefanpenner/9ccb0503e451a9792ed0

        task.addObserver('id', function(task)
        {
            setTimeout(function() {
                list.get('tasks').pushObject(Macaque.Task.find(task.id));
                list.get('transaction').commit();
            }, 1);
        });

        task.get('transaction').commit();

        this.set('newTask', { text: '', 'list': list.id });
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

    classNames: ['task-view'],

    click: function(e)
    {
        if ($(e.target).closest('#task-view-edit-button').length) {
            $('#task-view-edit-field').focus();
        }
    },

    keyDown: function(e)
    {
        console.log(e.keyCode);
        if (e.target.id === 'task-view-edit-field') {
            if ($.inArray(e.keyCode, [13, 27]) !== -1) {
              this.get('controller').send('endEdit');
            }
        }
    }

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
        // get breadcrumb history
        var previousList = this.controllerFor('application').get('previousList');

        if (previousList) {
            controller.set('previousList', previousList);

            var tasks = previousList.get('tasks'),
                index = tasks.indexOf(model),
                count = tasks.get('length');

            if (count > 0) {
                controller.set('nextTask', tasks.objectAt( index < count - 1 ? index + 1 : 0));
                controller.set('previousTask', tasks.objectAt( index > 0 ? index - 1 : count - 1 ));
            }
        }

        controller.set('content', model);
        controller.set('isEditing', false);
    },

    events: {

        edit: function()
        {
            this.get('controller').startEdit();
        },

        remove: function()
        {
            var task = this.currentModel,
                list = task.get('lists').objectAt(0);

            this.get('controller').removeTask(task);

            if (list) {
                this.transitionTo('list', list);
            } else {
                this.transitionTo('index');
            }
        }
    }
});

Macaque.TaskController = Ember.ObjectController.extend({

    needs: 'application',

    isEditing: false,

    startEdit: function()
    {
        this.set('isEditing', true);
    },

    endEdit: function()
    {
        this.set('isEditing', false);
        this.get('store').commit();
    },

    removeTask: function(task)
    {
        var lists = task.get('lists');

        task.one('didDelete', this, function()
        {
            // force the parent lists to update because our hasMany is borked
            lists.forEach(function(list) {
                // // this is now done server-side
                // list.set('modified', new Date());
                // list.get('transaction').commit();
                // list.one('didUpdate', function()
                // {
                    list.reload();

                    // force the template view to update - why doesnt it?
                    list.one('didReload', function() {
                        list.set('tasks', list.get('tasks'));
                    });
                // });
            });
        });

        // hide from template until the task is deleted
        task.set('isHidden', true);
        task.deleteRecord();
        // this.get('store').commit();
        task.get('transaction').commit();
    }

});
