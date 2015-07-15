var mask_TreeWalker;
(function(){
	/**
	 * TreeWalker
	 * @memberOf mask
	 * @name TreeWalker
	 */
	mask_TreeWalker = {
		/**
		 * Visit each mask node
		 * @param {MaskNode} root
		 * @param {TreeWalker~SyncVisitior} visitor
		 * @memberOf mask.TreeWalker
		 */
		walk: function(root, fn) {
			if (typeof root === 'object' && root.type === Dom.CONTROLLER) {
				new SyncWalkerCompos(root, fn);
				return root;
			}
			root = prepairRoot(root);
			new SyncWalker(root, fn);
			return root;
		},
		/**
		 * Asynchronous visit each mask node
		 * @param {MaskNode} root
		 * @param {TreeWalker~AsyncVisitior} visitor
		 * @param {function} done
		 * @memberOf mask.TreeWalker
		 */
		walkAsync: function(root, fn, done){
			root = prepairRoot(root);
			new AsyncWalker(root, fn, done);
		}
	};

	var SyncWalker,
		SyncWalkerCompos;
	(function(){
		SyncWalker = function(root, fn){
			walk(root, fn);
		};
		SyncWalkerCompos = function(root, fn){
			walkCompos(root, fn, root);
		};
		function walk(node, fn, parent, index) {
			if (node == null) 
				return null;

			var deep = true, break_ = false, mod;
			if (isFragment(node) !== true) {
				mod = fn(node);
			}
			if (mod !== void 0) {
				mod = new Modifier(mod);
				mod.process(new Step(node, parent, index));
				deep   = mod.deep;
				break_ = mod['break'];
			}			
			var nodes = safe_getNodes(node);
			if (nodes == null || deep === false || break_ === true) {
				return mod;
			}
			var imax = nodes.length,
				i = 0, x;
			for(; i < imax; i++) {
				x = nodes[i];
				mod = walk(x, fn, node, i);
				if (mod != null && mod['break'] === true) {
					return mod;
				}
			}
		}
		function walkCompos(compo, fn, parent, index) {
			if (compo == null) 
				return;

			var mod = fn(compo, index);
			if (mod !== void 0) {
				if (mod.deep === false || mod['break'] === true) {
					return mod;
				}
			}
			var compos = compo.components;
			if (compos == null) {
				return null;
			}
			var imax = compos.length,
				i = 0, x;
			for(; i < imax; i++) {
				x = compos[i];
				mod = walkCompos(x, fn, compo, i);
				if (mod != null && mod['break'] === true) {
					return mod;
				}
			}
		}
	}());
	var AsyncWalker;
	(function(){
		AsyncWalker = function(root, fn, done){
			this.stack = [];
			this.done = done;
			this.root = root;
			this.fn = fn;

			this.process = this.process.bind(this);
			this.visit(this.push(root));
		};
		AsyncWalker.prototype = {
			current: function(){
				return this.stack[this.stack.length - 1];
			},
			push: function(node, parent, index){
				var step = new Step(node, parent, index);
				this.stack.push(step);
				return step;
			},
			pop: function(){
				return this.stack.pop();
			},
			getNext: function(goDeep){
				var current  = this.current(),
					node = current.node,
					nodes = safe_getNodes(node);
				if (node == null) {
					throw Error('Node is null');
				}
				if (nodes != null && goDeep !== false && nodes.length !== 0) {
					if (nodes[0] == null) {
						throw Error('Node is null');
					}
					return this.push(
						nodes[0],
						node,
						0
					);
				}
				var parent, index;
				while (this.stack.length !== 0) {
					current = this.pop();
					parent = current.parent;
					index  = current.index;
					if (parent == null) {
						this.pop();
						continue;
					}
					if (++index < parent.nodes.length) {
						return this.push(
							parent.nodes[index],
							parent,
							index
						);
					}
				}
				return null;
			},
			process: function(mod){
				var deep = true, break_ = false;

				if (mod !== void 0) {
					mod = new Modifier(mod);
					mod.process(this.current());
					deep   = mod.deep;
					break_ = mod['break'];
				}

				var next = break_ === true ? null : this.getNext(deep);
				if (next == null) {
					this.done(this.root);
					return;
				}
				this.visit(next);
			},

			visit: function(step){
				var node = step.node;
				if (isFragment(node) === false) {
					this.fn(node, this.process);
					return;
				}
				this.process();
			},

			fn: null,
			done: null,
			stack: null
		};
	}());

	var Modifier;
	(function(){
		/**
		 * @name IModifier
		 * @memberOf TreeWalker
		 */
		Modifier = function (mod, step) {
			for (var key in mod) {
				this[key] = mod[key];
			}
		};
		Modifier.prototype = {
			/**
			 * On `true` stops the walker			 
			 */
			'break': false,
			/**
			 * On `false` doesn't visit the subnodes
			 */
			deep: true,
			/**
			 * On `true` removes current node
			 */
			remove: false,
			/**
			 * On not `null`, replaces the current node with value
			 */
			replace: null,
			process: function(step){
				if (this.replace != null) {
					this.deep = false;
					step.parent.nodes[step.index] = this.replace;
					return;
				}
				if (this.remove === true) {
					this.deep = false;
					var arr = step.parent.nodes,
						i = step.index;
					_Array_splice.call(arr, i, 1);
					return;
				}
			}
		};	
	}());

	var Step = function (node, parent, index) {
		this.node = node;
		this.index = index;
		this.parent = parent;
	};

	/* UTILS */

	function isFragment(node) {
		return Dom.FRAGMENT === safe_getType(node);
	}
	function safe_getNodes(node) {
		var nodes = node.nodes;
		if (nodes == null) 
			return null;

		return is_Array(nodes)
			? (nodes)
			: (node.nodes = [ nodes ]);
	}
	function safe_getType(node) {
		var type = node.type;
		if (type != null)
			return type;

		if (is_Array(node)) return Dom.FRAGMENT;
		if (node.tagName != null) return Dom.NODE;
		if (node.content != null) return Dom.TEXTNODE;

		return Dom.NODE;
	}
	function prepairRoot(root){
		if (typeof root === 'string') {
			root = parser_parse(root);
		}
		if (isFragment(root) === false) {
			var fragment = new Dom.Fragment;
			fragment.appendChild(root);

			root = fragment;
		}
		return root;
	}

	/**
	 * Is called on each node
	 * @callback TreeWalker~SyncVisitor
	 * @param {MaskNode} node 
	 * @returns {Modifier|void}
	 */
	/**
	 * Is called on each node
	 * @callback TreeWalker~AsyncVisitor
	 * @param {MaskNode} node 
	 * @param {function} done - Optional pass @see{@link TreeWalker.IModifier} to the callback
	 * @returns {void}
	 */
}());