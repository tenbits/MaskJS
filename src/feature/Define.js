var Define;
(function(){
	Define = {
		create: function(node, model, ctr){
			return compo_fromNode(node, model, ctr);
		},
		registerGlobal: function(node, model, ctr) {
			var Ctor = Define.create(node, model, ctr);
			customTag_register(
				node.name, Ctor
			);
		},
		registerScoped: function(node, model, ctr) {
			var Ctor = Define.create(node, model, ctr);
			customTag_registerScoped(
				ctr, node.name, Ctor
			);
		}
	};
	
	function compo_prototype(tagName, attr, nodes, owner, model, Ctor) {
		var arr = [];
		var Proto = {
			tagName: tagName,
			template: arr,
			attr: attr,
			location: trav_location(owner),
			meta: {
				template: 'merge'
			},
			renderStart: function(){
				Compo.prototype.renderStart.apply(this, arguments);
				if (this.nodes === this.template) {
					this.nodes = mask_merge(this.nodes, [], this);
				}
			},
			getHandler: null
		};
		var imax = nodes == null ? 0 : nodes.length,
			i = 0, x, name;
		for(; i < imax; i++) {
			x = nodes[i];
			if (x == null) 
				continue;
			name = x.tagName;
			if ('function' === name) {
				Proto[x.name] = x.fn;
				continue;
			}
			if ('slot' === name || 'event' === name) {
				if ('event' === name && Proto.tagName != null) {
					// bind the event later via the component
					arr.push(x);
					continue;
				}
				var type = name + 's';
				var fns = Proto[type];
				if (fns == null) {
					fns = Proto[type] = {};
				}
				fns[x.name] = x.fn;
				continue;
			}
			if ('define' === name || 'let' === name) {
				var fn = name === 'define'
					? Define.registerGlobal
					: Define.registerScoped;
				fn(x, model, Proto);
				continue;
			}
			if ('var' === name) {
				var obj = x.getObject(model, null, owner),
					key, val;
				for(key in obj) {
					val = obj[key];
					if (key === 'meta' || key === 'model' || key === 'attr') {
						Proto[key] = obj_extend(Proto[key], val);	
					}
					var scope = Proto.scope;
					if (scope == null) {
						Proto.scope = scope = {};
					}
					scope[key] = val;
				}
				continue;
			}
			arr.push(x);
		}
		return Proto;
	}
	function compo_extends(extends_, model, ctr) {
		var args = [];
		if (extends_ == null) 
			return args;
		
		var imax = extends_.length,
			i = -1,
			await = 0, x;
		while( ++i < imax ){
			x = extends_[i];
			if (x.compo) {
				var compo = resolveCompo(x.compo, ctr);
				if (compo != null) {
					args.unshift(compo);
					continue;
				}
				
				var obj = expression_eval(x.compo, model, null, ctr);
				if (obj != null) {
					args.unshift(obj);
					continue;
				}
				log_error('Nor component, nor scoped data is resolved:', x.compo);
				continue;
			}
		}
		return args;
	}
	function resolveCompo(compoName, ctr) {
		while (ctr != null) {
			if (ctr.getHandler) {
				var x = ctr.getHandler(compoName);
				if (x != null) 
					return x;
			}
			ctr = ctr.parent;
		}
		return custom_Tags[compoName];
	}
	function compo_fromNode(node, model, ctr) {
		var extends_ = node['extends'],
			as_ = node['as'],
			tagName,
			attr;
		if (as_ != null) {
			var x = parser_parse(as_);
			tagName = x.tagName;
			attr = obj_extend(node.attr, x.attr);
		}
		
		var name = node.name,
			Proto = compo_prototype(tagName, attr, node.nodes, ctr, model),
			args = compo_extends(extends_, model, ctr)
			;
		
		args.push(Proto);
		return Compo.apply(null, args);
	}
	
	function trav_location(ctr) {
		while(ctr != null) {
			if (ctr.location) {
				return ctr.location;
			}
			if (ctr.resource && ctr.resource.location) {
				return ctr.resource.location;
			}
			ctr = ctr.parent;
		}
		return null;
	}
}());