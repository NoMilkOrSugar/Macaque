/*!
 * Macaque (client)
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

Ember.Handlebars.registerBoundHelper('fromNow', function(date) {
    return moment(date).fromNow();
});

Ember.Handlebars.registerBoundHelper('formattedDate', function(date) {
    return moment(date).format('h:mma - D MMM YYYY');
});

Ember.Handlebars.registerBoundHelper('basicMarkdown', function(text) {

    // HTML entities
    text = (text||'').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // code elements
    // https://github.com/coreyti/showdown/blob/master/src/showdown.js
    text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
        function(wholeMatch,m1,m2,m3,m4) {
            return m1 +'<code>' + m3.replace(/^\s+|\s+$/g,'') + '</code>';
        });

    // bold elements
    text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g, '<strong>$2</strong>');

    // italic elements
    text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>');

    return new Handlebars.SafeString(text);
});

/* ==========================================================================
   Macaque
   ========================================================================== */

Macaque = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// enable History API (requires catch-all route on server)
Macaque.Router.reopen({ location: 'history' });

Macaque.RESTAdapter = DS.RESTAdapter.extend({

    url: 'http://localhost:3000',

    namespace: 'api',

    serializer: DS.RESTSerializer.extend({

        init: function()
        {
            this._super();

            this.configure('plurals', {
                list: 'lists',
                task: 'tasks'
            });
        },

        primaryKey: function(type) {
            return '_id';
        },

        // the default Ember Serializer converts IDs to numbers meaning all-numeric
        // MongoDB IDs are serialized in the URL like `5.1755256517945e`

        // https://github.com/emberjs/data/blob/master/packages/ember-data/lib/system/serializer.js
        // serializeId: function(id) {
        //     if (isNaN(id)) { return id; }
        //     return +id;
        // }
        serializeId: function(id) {
            return id.toString();
        },

        // Ember Data only serializes hasMany relationships if they're embedded records
        //
        // Macaque.RESTAdapter.map('Macaque.Task', {
        //     'lists': { embedded: 'always' }
        // });
        //
        // Serialize hasMany IDs to mimic sideloaded relationships
        //
        addHasMany: function(hash, record, key, relationship)
        {
            if (/_ids$/.test(key)) {
                hash[key] = [];
                record.get(this.pluralize(key.replace(/_ids$/, ''))).forEach(function(item) {
                    hash[key].push(item.get('id'));
                });
            }
            return hash;
        }
    })
});

Macaque.Store = DS.Store.extend({

    revision: 12,
    adapter: Macaque.RESTAdapter

});

Macaque.List = DS.Model.extend({
    name     : DS.attr('string'),
    created  : DS.attr('date'),
    modified : DS.attr('date'),
    isHidden : DS.attr('boolean'),
    tasks    : DS.hasMany('Macaque.Task').property('tasks.@each.isHidden'),

    orderedTasks: function() {
        return Ember.ArrayProxy.createWithMixins(Macaque.SortableMixin, {
            sortAscending: [true, false],
            sortProperties: ['isComplete', 'modified'],
            content: this.get('tasks')
        });
    }.property('tasks'),

    taskCount: function() {
        return this.get('tasks').get('length');
    }.property('tasks'),

    openTaskCount: function() {
        return this.get('tasks').filterProperty('isComplete', false).get('length');
    }.property('tasks.@each.isComplete')
});

Macaque.Task = DS.Model.extend({
    text       : DS.attr('string'),
    created    : DS.attr('date'),
    modified   : DS.attr('date'),
    isComplete : DS.attr('boolean'),
    isHidden   : DS.attr('boolean'),
    lists      : DS.hasMany('Macaque.List'),

    isCompleteChange: function () {
        Ember.run.once(this, function () {
            this.get('store').commit();
        });
    }.observes('isComplete')
});

// extend Ember.SortableMixin to allow `sortAscending` value per property
// https://github.com/emberjs/ember.js/blob/master/packages/ember-runtime/lib/mixins/sortable.js
Macaque.SortableMixin = Ember.Mixin.create(Ember.SortableMixin, {

    sortProperties: null,

    sortAscending: [true],

    orderBy: function(item1, item2)
    {
        var result = 0,
            sortProperties = Ember.get(this, 'sortProperties'),
            sortAscending = Ember.get(this, 'sortAscending');

        Ember.assert("you need to define `sortProperties`", !!sortProperties);

        Ember.EnumerableUtils.forEach(sortProperties, function(propertyName, i)
            {
                if (result === 0) {
                    result = Ember.compare(Ember.get(item1, propertyName), Ember.get(item2, propertyName));
                if ((result !== 0) && !sortAscending[i]) {
                    result = (-1) * result;
                }
            }
        });
        return result;
    }
});

/* ==========================================================================
   Macaque Router
   ========================================================================== */

Macaque.Router.map(function()
{
    this.route('settings', { path: '/settings' });

    this.resource('list', { path: '/list/:id' }, function() {
        // this.route('edit', { path: '/edit' });
    });

    this.route('tasks', { path: '/tasks' });

    this.resource('task', { path: '/task/:id'}, function() {
        // this.route('edit', { path: '/edit' });
    });
});

/* ==========================================================================
   Macaque Application
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
   Macaque Settings
   ========================================================================== */

Macaque.SettingsRoute = Ember.Route.extend({

    setupController: function(controller)
    {
        controller.set('isSaving', false);
        controller.set('hasSuccess', false);
        controller.set('hasFailure', false);
    }

});

Macaque.SettingsController = Ember.Controller.extend({

    isSaving: false,

    hasSuccess: false,

    hasFailure: false,

    backup: function()
    {
        var controller = this;
        if (controller.get('isSaving')) return;
        controller.set('isSaving', true);

        var onFail = function(err)
        {
            controller.set('hasSuccess', false);
            controller.set('hasFailure', true);
        };

        $.getJSON('/api/export/backup').done(function(json)
        {
            if (json && json.success) {
                controller.set('hasSuccess', true);
                controller.set('hasFailure', false);
            } else {
                onFail();
            }

        }).fail(onFail).always(function()
        {
            controller.set('isSaving', false);
        });
    }
});

/* ==========================================================================
   Macaque Index
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

        controller.set('newList', { name: '' });
        controller.set('content', model);
    }
});

Macaque.IndexController = Ember.Controller.extend({

    orderedLists: function() {
        return Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
            sortAscending: false,
            sortProperties: ['modified'],
            content: this.get('content')
        });
    }.property('content'),

    createList: function()
    {
        var list = Macaque.List.createRecord(this.get('newList'));

        list.set('created', new Date());
        list.set('modified', new Date());
        list.set('isHidden', true);

        list.addObserver('id', function(task)
        {
            setTimeout(function() {
                list.set('isHidden', false);
                list.get('transaction').commit();
            }, 1);
        });

        list.get('transaction').commit();

        this.set('newList', { name: '' });
    }

});

Macaque.ListCreateView = Ember.View.extend({

    templateName: 'list-create',

    classNames: ['list-create-view'],

    click: function(e)
    {
        if (e.target.id === 'list-create-button') {
            field = document.getElementById('list-create-text');
            if (!field.value || /^\s*$/.test(field.value)) {
                return;
            }
            this.get('controller').send('createList');
        }
    },

    keyDown: function(e)
    {
        if (e.target.id === 'list-create-text' && e.keyCode === 13) {
            this.get('controller').send('createList');
        }
    }
});

/* ==========================================================================
   Macaque List
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
        controller.set('newTask', { text: '' });
    },

    events: {

        edit: function()
        {
            this.get('controller').startEdit();
        },

        remove: function()
        {
            this.get('controller').removeList(this.currentModel);
            this.transitionTo('index');
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

    createTask: function()
    {
        var list = this.get('content'),
            task = Macaque.Task.createRecord(this.get('newTask'));

        task.set('created', new Date());
        task.set('modified', new Date());
        task.get('lists').pushObject(list);

        task.addObserver('id', function(task)
        {
            list.reload();

            // now fixed with Macaque.RESTAdapter

            // https://github.com/emberjs/data/issues/405
            // http://stackoverflow.com/questions/15624193/many-to-many-relationships-with-ember-ember-data-and-rails
            // https://gist.github.com/stefanpenner/9ccb0503e451a9792ed0
            // list.get('tasks').pushObject(task);
            // list.get('transaction').commit();
            // setTimeout(function() {
            //     list.reload();
            //     list.one('didReload', function() {
            //         list.set('tasks', list.get('tasks'));
            //     });

            // }, 1);
        });

        task.get('transaction').commit();

        this.set('newTask', { text: '' });
    },

    removeList: function(list)
    {
        list.set('isHidden', true);
        list.deleteRecord();
        list.get('transaction').commit();
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
            this.get('controller').send('createTask');
        }
    },

    keyDown: function(e)
    {
        if (e.target.id === 'task-create-text' && e.keyCode === 13) {
            this.get('controller').send('createTask');
        }
    }
});

/* ==========================================================================
   Macaque Tasks (all)
   ========================================================================== */

Macaque.TasksRoute = Ember.Route.extend({

    model: function(params)
    {
        return Macaque.Task.find();
    },

    setupController: function(controller, model)
    {
        controller.set('content', model);
    }
});

Macaque.TasksController = Ember.Controller.extend({

    orderedTasks: function() {
        return Ember.ArrayProxy.createWithMixins(Macaque.SortableMixin, {
            sortAscending: [true, false],
            sortProperties: ['isComplete', 'modified'],
            content: this.get('content')
        });
    }.property('content'),

    openTaskCount: function() {
        return this.get('orderedTasks').filterProperty('isComplete', false).get('length');
    }.property('orderedTasks.@each.isComplete')
});

/* ==========================================================================
   Macaque Task
   ========================================================================== */

Macaque.TaskView = Ember.View.extend({

    classNames: ['task-view'],

    click: function(e)
    {
        var el = $(e.target);
        if (el.closest('#task-view-edit-button').length) {
            $('#task-view-edit-field').focus();
        }
    },

    keyDown: function(e)
    {
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

            var tasks = previousList.get('orderedTasks'),
                index = tasks.indexOf(model),
                count = tasks.get('length');

            if (count > 0) {
                controller.set('nextTask', tasks.objectAt( index < count - 1 ? index + 1 : 0));
                controller.set('previousTask', tasks.objectAt( index > 0 ? index - 1 : count - 1 ));
            }
        }

        controller.set('selectedList', null);
        controller.set('selectLists', this.controllerFor('index').get('orderedLists'));

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
            var route = this,
                task = this.currentModel,
                lists = task.get('lists');

            task.one('didDelete', function()
            {
                if (!lists.get('length')) {
                    route.transitionTo('index');
                }
                // transition to first list after reload
                lists.forEach(function(list, i) {
                    list.reload();
                    if (i) return;
                    list.one('didReload', function() {
                        route.transitionTo('list', list);
                    });
                });
            });

            // hide from template until the task is deleted
            task.set('isHidden', true);
            task.deleteRecord();
            task.get('transaction').commit();
        }
    }
});

Macaque.TaskController = Ember.ObjectController.extend({

    needs: ['application', 'index'],

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

    addToList: function()
    {

        var task = this.get('content'),
            list = this.get('selectedList');

        if (!list || task.get('lists').contains(list)) return;

        task.get('lists').addObject(list);
        task.one('didUpdate', function(task) {
            list.reload();
        });
        task.get('transaction').commit();
    },

    removeFromList: function(list)
    {
        var task = this.get('content');
        task.get('lists').removeObject(list);
        task.one('didUpdate', function(task) {
            list.reload();
        });
        task.get('transaction').commit();
    }
});
