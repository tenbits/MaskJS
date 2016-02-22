var builder_resumeDelegate,
	builder_pushCompo,
	builder_setCompoAttributes;

(function(){

	builder_resumeDelegate = function (ctr, model, ctx, container, children, finilizeFn){
		var anchor = document.createComment('');
		container.appendChild(anchor);
		return function(){
			return _resume(ctr, model, ctx, anchor, children, finilizeFn);
		};
	};
	builder_pushCompo = function (ctr, compo) {
		var compos = ctr.components;
		if (compos == null) {
			ctr.components = [ compo ];
			return;
		}
		compos.push(compo);
	};

	builder_setCompoAttributes = function(compo, node, model, ctx, container){
		var attr = node.attr;
		if (attr == null) {
			attr = {};
		}
		else {
			attr = obj_create(attr);
			for(var key in attr) {
				var fn = attr[key];
				if (typeof fn === 'function') {
					attr[key] = fn('compo-attr', model, ctx, container, compo, key);
				}
			}
		}
		var readAttributes = compo.meta && compo.meta.readAttributes;
		if (readAttributes != null) {
			readAttributes.call(compo, compo, attr, model, container);
		}
		var ownAttr = compo.attr;
		for(var key in ownAttr) {
			var current = attr[key],
				val = null;

			if (current == null || key === 'class') {
				var x = ownAttr[key];

				val = is_Function(x)
					? x('compo-attr', model, ctx, container, compo, key)
					: x;
			}
			if (key === 'class') {
				attr[key] = current == null ? val : (current + ' ' + val);
				continue;
			}
			if (current != null) {
				continue;
			}
			attr[key] = val;
		}
		return (compo.attr = attr);
	};

	// == private

	function _resume(ctr, model, ctx, anchorEl, children, finilize) {

		if (ctr.tagName != null && ctr.tagName !== ctr.compoName) {
			ctr.nodes = {
				tagName: ctr.tagName,
				attr: ctr.attr,
				nodes: ctr.nodes,
				type: 1
			};
		}
		if (ctr.model != null) {
			model = ctr.model;
		}

		var nodes = ctr.nodes,
			elements = [];
		if (nodes != null) {

			var isarray = nodes instanceof Array,
				length = isarray === true ? nodes.length : 1,
				i = 0,
				childNode = null,
				fragment = document.createDocumentFragment();

			for (; i < length; i++) {
				childNode = isarray === true ? nodes[i] : nodes;

				builder_build(childNode, model, ctx, fragment, ctr, elements);
			}

			anchorEl.parentNode.insertBefore(fragment, anchorEl);
		}


		// use or override custom attr handlers
		// in Compo.handlers.attr object
		// but only on a component, not a tag ctr
		if (ctr.tagName == null) {
			var attrHandlers = ctr.handlers && ctr.handlers.attr,
				attrFn,
				key;
			for (key in ctr.attr) {

				attrFn = null;

				if (attrHandlers && is_Function(attrHandlers[key])) {
					attrFn = attrHandlers[key];
				}

				if (attrFn == null && is_Function(custom_Attributes[key])) {
					attrFn = custom_Attributes[key];
				}

				if (attrFn != null) {
					attrFn(anchorEl, ctr.attr[key], model, ctx, elements[0], ctr);
				}
			}
		}

		if (is_Function(finilize)) {
			finilize.call(
				ctr
				, elements
				, model
				, ctx
				, anchorEl.parentNode
			);
		}


		if (children != null && children !== elements){
			var il = children.length,
				jl = elements.length,
				j  = -1;

			while(++j < jl){
				children[il + j] = elements[j];
			}
		}
	}

}());