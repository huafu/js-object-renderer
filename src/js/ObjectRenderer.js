/**
 * @fileOverview
 * ObjectRenderer is freely distributable under the terms of an MIT license:
 * 
 * Copyright (c) 2011 Pierre Gandon <pierregandon@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @class ObjectRenderer
 * @since 25 sept. 2011
 * @author Pierre GANDON <pierregandon@gmail.com>
 * @example
 * <code>
 *	var someVar;
 *	// [...] doing something with "someVar"
 *	var renderer = new ObjectRenderer('someVar');
 *	$('some_element_id').insert(renderer.getElement());
 *	renderer.describeData(someVar);
 * </code>
 */
var ObjectRenderer = Class.create(
/**
 * @lends ObjectRenderer.prototype
 */
{
	/**
	 * @private
	 * @type Element
	 * @description The element containing all the output
	 */
	$container: null,


	/**
	 * @private
	 * @type Element
	 * @description The element containing the headeing output (name, +/-, type, ...)
	 */
	$header: null,


	/**
	 * @private
	 * @type Element
	 * @description The [+]/[-] element
	 */
	$plusMinus: null,


	/**
	 * @private
	 * @type Element
	 * @description The label of the variable, containing also the size and the type
	 */
	$label: null,


	/**
	 * @private
	 * @type Element
	 * @description The element containing all sub-elements representing the members of the variable
	 */
	$content: null,


	/**
	 * @private
	 * @type Element
	 * @description The input element which allow some filtering on properties
	 */
	$filter: null,


	/**
	 * @private
	 * @type String
	 * @description Name of the variable (to display only)
	 */
	name: null,


	/**
	 * @private
	 * @type ObjectRenderer
	 * @description The parent object renderer of this object, might be null for root level
	 */
	parent: null,


	/**
	 * @private
	 * @type Array
	 * @description All children object renderer, used to render the members of this object
	 */
	children: null,


	/**
	 * @private
	 * @type Boolean
	 * @description To know if the object is listening for events or not
	 */
	listeningEvents: null,


	/**
	 * @private
	 * @type Object
	 * @description The pending data to show
	 */
	pendingData: null,


	/**
	 * Constructor
	 *
	 * @constructor
	 * @methodOf ObjectRenderer#
	 * @param {String} name The name of the variable to show
	 * @param {ObjectRenderer} parent The parent renderer object
	 */
	initialize: function(name, parent)
	{
		this.children = $A();
		this.pendingData = null;
		this.parent = parent ? parent : null;
		this.name = name ? name : '?unnamed?';
		this.$header = new Element('div', {'class': 'jso-header'});
		this.$plusMinus = new Element('a', {'class': 'jso-plus-minus plus'});
		this.$plusMinus.update('+').hide();
		this.$header.insert(this.$plusMinus);
		this.$label = new Element('span', {'class': 'jso-label'});
		this.$header.insert(this.$label);
		this.$filter = new Element('input', {'class': 'jso-filter'});
		this.$content = new Element('div', {'class': 'jso-content'});
		this.$content.hide();
		this.$container = new Element('div', {'class': 'jso-container'});
		this.$container.insert(this.$header);
		this.$container.insert(this.$content);
		this.listeningEvents = false;
		if ( !parent )
		{
			return;
		}
		var v = parent.$filter.getValue().strip().toLowerCase();
		if ( v === '' || this.name.toLowerCase().indexOf(v) != -1 )
		{
			this.show();
		}
		else
		{
			this.hide();
		}
	},


	/**
	 * To get the main HTML element containing all the output
	 *
	 * @return The HTML element containing all the outut
	 * @type Element
	 */
	getElement: function()
	{
		return this.$container;
	},


	/**
	 * Set the variable to describe in this object renderer
	 * Call this after being sure the main element (see #getElement()) has been
	 * inserted in the DOM somewhere
	 *
	 * @chainable
	 * @param {Object} data The data to be described (any variable)
	 * @param {String} name The name of the data, optional
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	describeData: function(data, name)
	{
		var type = this.getType(data), value = null, count = null, p, jsor, rtype,
			pm = false, small, title = $A(), t, e, labelHtml;
		this.undescribeData();
		if ( name && Object.isString(name) )
		{
			this.name = name;
		}
		if ( type == 'Object' )
		{
			rtype = Object.getClassName(data);
		}
		else
		{
			rtype = type;
		}
		if ( rtype == 'Function' )
		{
			type = rtype;
		}
		if ( rtype == 'null' || rtype == 'undefined' ) {
			rtype = null;
		}

		labelHtml = '<span class="jso-name">' + this.name + '</span>';

		if ( rtype !== null ) {
			labelHtml += '&nbsp;<span class="jso-type">' + rtype + '</span>';
		}

		this.$label.update(labelHtml);

		switch ( type )
		{
			case 'Function':
				data.source = data.toString();
				
			case 'Object':
			case 'Element':
				count = 0;
				this.$plusMinus.show();
				for ( p in data )
				{
					if ( !p ) continue;
					count++;
					jsor = new ObjectRenderer(p, this);
					this.children.push(jsor);
					this.$content.insert(jsor.getElement());
					try
					{
						t = data[p];
					}
					catch ( e )
					{
						t = '??: ' + e.toString();
					}

					jsor._setPendingData(p, t);
					jsor = null;
				}
				pm = (count > 0);
				break;

			case 'Hash':
				this.$plusMinus.show();
				$H(data).each(function(item)
				{
					var jsor = new ObjectRenderer(item.key, this);
					this.children.push(jsor);
					this.$content.insert(jsor.getElement());
					jsor._setPendingData(item.key, item.value);
				}, this);
				count = $H(data).size();
				pm = (count > 0);
				break;
			
			case 'Array':
				this.$plusMinus.show();
				$A(data).each(function(item, index)
				{
					var jsor = new ObjectRenderer('' + index, this);
					this.children.push(jsor);
					this.$content.insert(jsor.getElement());
					jsor._setPendingData('' + index, item);
				}, this);
				count = $A(data).size();
				pm = (count > 0);
				break;

			case 'Boolean':
				value = data ? 'true' : 'false';
				break;

			case 'Number':
				value = '' + data;
				value = value.startsWith('.') ? ('0' + value) : value;
				if ( Math.ceil(value) == value )
				{
					t = new Date(value*1000);
					title.push('Unix timestamp: ' + t.toUTCString());
				}
				break;

			case 'Date':
				value = data.toUTCString();
				break;

			case 'null':
			case 'undefined':
				value = type;
				break;

			case 'String':
				small = data;
				if ( data.length > 30 )
				{
					small = small.substr(0, 27) + '...';
					this.$content.update('<pre class="jso-pre">' + data.escapeHTML() + '</pre>');
					pm = true;
				}
				value = Object.toJSON(small);
				count = data.length;
				break;
				
			default:
				throw new Error('Unable to describe a type called "' + type + '"');
				break;
		}
		if ( count !== null )
		{
			this.$label.insert('(<span class="jso-size">' + count + '</span>)');
		}
		if ( value )
		{
			this.$label.insert('&nbsp;:&nbsp;<span class="jso-value">' + value.escapeHTML() + '</span>');
		}
		this.$plusMinus[pm ? 'show' : 'hide']();
		if ( title.length > 0 )
		{
			this.$header.title = title.join("\n");
		}
		if ( pm && type != 'String' && type != 'Function' )
		{
			this.$label.insert('&nbsp;-&nbsp;filter:&nbsp;');
			this.$label.insert(this.$filter);
		}
		this._attachEvents();
		return this;
	},


	/**
	 * Will free the output of any data, and also free the event listeners, and sub-objects
	 *
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	undescribeData: function()
	{
		this._detachEvents();
		this.children.each(function(item)
		{
			item.undescribeData();
		}, this);
		this.$content.update();
		this.$label.update();
		this.$header.title = null;
		this.$filter.setValue('');
		return this;
	},


	/**
	 * Show the variable detals
	 *
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	show: function()
	{
		this.$container.show();
	},


	/**
	 * Hide the variable detals
	 *
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	hide: function()
	{
		this.$container.hide();
	},


	/**
	 * Attach all events needed for this evel
	 *
	 * @private
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	_attachEvents: function()
	{
		if ( this.listeningEvents )
		{
			return this;
		}
		this.$plusMinus.observe('click', this._handlePlusMinusClick.bind(this));
		this.$filter.observe('keyup', this._handleFilterChange.bind(this));
		this.listeningEvents = true;
		return this;
	},


	/**
	 * Detach all events previously attached on this level
	 *
	 * @private
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	_detachEvents: function()
	{
		if ( !this.listeningEvents )
		{
			return this;
		}
		this.$plusMinus.stopObserving('click');
		this.$filter.stopObserving('keyup');
		this.listeningEvents = false;
		return this;
	},


	/**
	 * Defines the pending data to be parsed when expanding the parent node
	 *
	 * @private
	 * @chainable
	 * @param {String} name The name of the pending data
	 * @param data The pending data to set
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	_setPendingData: function(name, data)
	{
		this.pendingData = [name, data];
	},


	/**
	 * Handle the change of filter text
	 *
	 * @private
	 * @chainable
	 * @param {Event} event The event which has called this handler
	 */
	_handleFilterChange: function(event)
	{
		var v = this.$filter.getValue().strip().toLowerCase();
		this.children.each(function(item)
		{
			if ( v === '' || item.name.toLowerCase().indexOf(v) != -1 )
			{
				item.show();
			}
			else
			{
				item.hide();
			}
		}, this);
	},


	/**
	 * Collapse element, hiding children
	 *
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	collapse: function()
	{
		if ( !this.$plusMinus.visible() )
		{
			return this;
		}
		this.$plusMinus.update('+').removeClassName('minus').addClassName('plus');
		this.$content.hide();
		return this;
	},


	/**
	 * Expand element, showing children and computing their rendering
	 *
	 * @chainable
	 * @return This object, to be able to do chained calls
	 * @type ObjectRenderer
	 */
	expand: function()
	{
		var loading = false;
		if ( !this.$plusMinus.visible() )
		{
			return this;
		}
		this.children.each(function(node)
		{
			if ( node.pendingData )
			{
				if ( !loading )
				{
					loading = new Element('span', {'class': 'jso-loading'});
					loading.update('Loading...');
					this.$content.insert({top: loading});
				}
				node.describeData.bind(node, node.pendingData[1], node.pendingData[0]).defer();
				node.pendingData.pop();
				node.pendingData.pop();
				node.pendingData = null;
			}
		}, this);
		this.$plusMinus.update('\u2014').removeClassName('plus').addClassName('minus');
		this.$content.show();
		if ( loading )
		{
			loading.remove.bind(loading).defer();
		}
		return this;
	},


	/**
	 * Automatically expand all nodes to be able to reach the good element
	 * looking at the given path, and filter all nodes to see only that element
	 *
	 * @param {String} path The path to the data to reach
	 * @param {Boolean} filter If true, a filter corresponding to each path level will be applied too
	 * @param {Boolean} delayed If true, the call will be delayed to have GUI refreshed
	 */
	autoExpandAndFilter: function(path, filter, delayed)
	{
		var parts = path;
		if ( !Object.isArray(parts) )
		{
			parts = parts.split(/[\.\[\]]/g);
		}
		var child, n = parts.shift();
		this.expand();
		if ( !n )
		{
			return;
		}
		child = this.childByName(n);
		if ( filter && this.$filter.visible() )
		{
			this.$filter.setValue(n);
			this._handleFilterChange();
		}
		if ( child )
		{
			if ( delayed )
			{
				child.autoExpandAndFilter.bind(child, parts, filter, true).defer();
			}
			else
			{
				child.autoExpandAndFilter(parts, filter, false);
			}
		}
	},


	/**
	 * Find the first child with the given name
	 *
	 * @param {String} name The name of the child to get
	 * @return The found child, or null if no such child found
	 * @type ObjectRenderer
	 */
	childByName: function(name)
	{
		var r = null;
		this.children.each(function(item)
		{
			if ( item.name == name )
			{
				r = item;
				throw $break;
			}
		}, this);
		return r;
	},


	/**
	 * Handle the click event on the plus/minus icon, to expand/collapse the data
	 *
	 * @private
	 * @chainable
	 * @param {Event} event The event which has called this handler
	 */
	_handlePlusMinusClick: function(event)
	{
		this[this.$content.visible() ? 'collapse' : 'expand']();
		event.preventDefault();
	},


	/**
	 * Compute the type of the given data and return it as a string
	 *
	 * @private
	 * @chainable
	 * @return The name of the type of the given data
	 * @type String
	 */
	getType: function(data)
	{
		var res;
		switch ( true )
		{
			case (typeof(data) === 'undefined'):
				res = 'undefined';
				break;
				
			case Object.isString(data):
				res = 'String';
				break;
				
			case Object.isNumber(data):
				res = 'Number';
				break;
				
			case Object.isFunction(data):
				res = 'Function';
				break;
				
			case Object.isArray(data):
				res = 'Array';
				break;
				
			case Object.isElement(data):
				res = 'Element';
				break;
				
			case Object.isHash(data):
				res = 'Hash';
				break;
				
			case Object.isDate(data):
				res = 'Date';
				break;
				
			case (data === true):
			case (data === false):
				res = 'Boolean';
				break;
				
			case (data === null):
				res = 'null';
				break;
				
			default:
				res = 'Object';
				break;
		}
		return res;
	}
});


/**
 * Generate the DOM tree to inspect the given variable
 *
 * @methodOf Object
 * @param {Object} object The object to inspect
 * @param {Element|String} intoElement The element in which to insert the visual representation of the given object, option
 * @param {String} name The name of the variable, optional
 * @param {String} insertionType The type of insertion to do (top/bottom/before/after), optional
 * @return The object renderer instance for the given instance
 * @type {ObjectRenderer}
 * @example
 * <code>
 *	Object.inspectInto(
 *		myVariable,					// the variable to render visually
 *		'the_id_where_to_insert',	// An ID of an element, or an element in which to insert the rendering
 *		'my_variable_label'			// The label to see as variable's name
 *	);
 * </code>
 */
Object.inspectInto = function(object, intoElement, name, insertionType)
{
	var jsor = new ObjectRenderer(name ? name : null);
	var it = {}, el = $(intoElement);
	it[insertionType ? insertionType : 'bottom'] = jsor.getElement();
	if ( el )
	{
		el.insert(it);
	}
	jsor.describeData(object);
	return jsor;
};


/**
 * Try to retreive the class' name of an object
 *
 * @methodOf Object
 * @param {Object} object The object to get the class' name of
 * @return Name of the class of the object
 * @type {String}
 */
Object.getClassName = function(object)
{
	if ( !object.constructor || !object.constructor.toString )
	{
		return null;
	}
	var cn = /^\s*function\s*([\w0-9]+)\s*\(/gi.exec(object.constructor.toString());
	if ( !cn )
	{
		return 'Object';
	}
	cn = cn[1];
	if ( cn == 'klass' )
	{
		for ( cn in window )
		{
			if ( cn && window[cn] && cn != 'Object' && object !== window[cn] &&
					window[cn].prototype && window[cn].prototype.constructor &&
					object.constructor === window[cn].prototype.constructor )
			{
				return cn;
			}
		}
		return 'Object';
	}
	return cn;
};
