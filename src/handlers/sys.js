(function(mask) {

	mask.registerHandler('%', Sys);

	function Sys() {}

	Sys.prototype = {
		constructor: Sys,
		renderStart: function(model, cntx, container) {
			var attr = this.attr;

			if (attr['use'] != null) {
				this.model = util_getProperty(model, attr['use']);
				return;
			}

			if (attr['debugger'] != null) {
				debugger;
				return;
			}

			if (attr['log'] != null) {
				var key = attr.log,
					value = util_getProperty(model, key);

				console.log('Key: %s, Value: %s', key, value);
				return;
			}

			this.model = model;

			if (attr['if'] != null) {
				var check = attr['if'];

				this.state = ConditionUtil.isCondition(check, model);

				if (!this.state) {
					this.nodes = null;
				}
				return;
			}

			if (attr['else'] != null) {
				var compos = this.parent.components,
					prev = compos && compos[compos.length - 1];

				if (prev != null && prev.compoName === '%' && prev.attr['if'] != null) {

					if (prev.state) {
						this.nodes = null;
					}
					return;
				}
				console.error('Previous Node should be "% if=\'condition\'"', prev, this.parent);
				return;
			}

			// foreach is deprecated
			if (attr['foreach'] != null || attr['each'] != null) {
				each(this, model, cntx, container);
			}
		},
		render: null
	};


	function each(compo, model, cntx, container){
		if (compo.nodes == null && typeof Compo !== 'undefined'){
			Compo.ensureTemplate(compo);
		}

		var array = util_getProperty(model, compo.attr.foreach || compo.attr.each),
			nodes = compo.nodes,
			item = null;

		compo.nodes = [];
		compo.template = nodes;

		if (array instanceof Array === false){
			return;
		}

		for (var i = 0, x, length = array.length; i < length; i++) {
			x = array[i];

			item = new Component();
			item.nodes = nodes;
			item.model = x;
			item.container = container;

			compo.nodes[i] = item;
		}
	}

}(Mask));