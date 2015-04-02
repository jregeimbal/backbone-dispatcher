var Dispatcher =  function Dispatcher(options) {

	if(options && options.actions) {
		if(typeof options.actions === 'string') {
			this.createAction(options.actions);
		}
		else {	
			this.createActions(options.actions);
		}
	}

	Object.defineProperty(this, '_actions', {
		enumerable: false,
		value: {}
	});

	_.extend(this._actions, Backbone.Events);

	this.initialize.apply(this, arguments);
};

Dispatcher.extend = Backbone.Model.extend;

Dispatcher.VERSION = '0.0.6';

Dispatcher.prototype = {

	initialize: function initialize() {},

	_prepareAction: function _prepareAction(name, callbacks) {
		var action = {};

		if(_.isString(name)) {
			action.name = name;

			if(callbacks) {

				if(_.isFunction(callbacks)) {
					action.beforeEmit = callbacks;
				}
				else {
					for(var c in callbacks) {
						if(callbacks.hasOwnProperty(c)) {
							action[c] = callbacks[c];
						}
					}
				}

			}

		} else {
			action = name;
		}

		return action;
	},

	createAction: function createAction(name, callbacks) {
		var action = this._prepareAction(name, callbacks);

		var dispatch,
			self = this;

		var emit =  function(payload) {
			self.dispatch(action.name, payload);
		};

		var beforeEmit = function(payload) {
			action.beforeEmit(payload, function(newPayload) {
				emit(newPayload);
			});
		};

		var shouldEmit = function(fn) {
			return function(payload) {
				if(action.shouldEmit(payload)) {
					fn(payload);
				}
			};
		};

		if(action.shouldEmit) {
			if(action.beforeEmit) {
				dispatch = shouldEmit(beforeEmit);
			}
			else {
				dispatch = shouldEmit(emit);
			}
		}
		else if(action.beforeEmit) {
			dispatch = beforeEmit;
		}
		else {
			dispatch = emit;
		}

		Object.defineProperty(this, action.name, {
			enumerable: false,
			value: dispatch
		});

	},

	createActions: function createActions(actions) {
		var action;

		for (action in actions) {
			if (actions.hasOwnProperty(action)){
				this.createAction(actions[action]);
			}
		}
	},

	register: function register(action, listener, method) {
		if (!listener){
			throw new Error('The listener is undefined!');
		}

		method = typeof(method) === 'function' ? method : listener[method || action];
		if (typeof(method) !== 'function') {
			throw new Error('Cannot register callback `' + method + '` for the action `' + action + '`: the method is ' +
			'undefined on the provided listener object!');
		}

		this._actions.on(action, method.bind(listener));
	},

	registerStore: function registerStore(actions, listener, methods) {
		var isMethodsArray = Object.prototype.toString.call(methods) === '[object Array]';

		if (isMethodsArray && actions.length !== methods.length) {
			throw new Error('The number of given callbacks (' + methods.length + ') differs from the actions one (' +
			actions.length + ')!');
		}

		methods = methods || actions;
		for(var i = 0, action; (action = actions[i]); i++) {
			this.register(action, listener, isMethodsArray ? methods[i] : methods);
		}
	},

	dispatch: function dispatch(actionName, payload) {
		this._actions.trigger(actionName, payload);
	}

};
