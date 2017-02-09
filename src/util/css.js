var css_ensureScopedStyles;
(function(){
	css_ensureScopedStyles = function (str, node, el) {
		var attr = node.attr;
		if (attr.scoped == null && attr[KEY] == null) {
			return str;
		}
		// Remove `scoped` attribute to exclude supported browsers.
		// Redefine custom attribute to use same template later
		attr.scoped = null;
		attr[KEY] = 1;
		var id = getScopeIdentity(node, el);
		var str_ = str;
		str_ = transformScopedStyles(str_, id);
		str_ = transformHostCss(str_, id);
		return str_;
	};

	var KEY = 'x-scoped';
	var rgx_selector = /^([\s]*)([^\{\}]+)\{/gm;
	var rgx_host = /^([\s]*):host\s*(\(([^)]+)\))?\s*\{/gm;

	function transformScopedStyles (css, id){
		return css.replace(rgx_selector, function(full, pref, selector){
			if (selector.indexOf(':host') !== -1)
				return full;

			var arr = selector.split(','),
				imax = arr.length,
				i = 0;
			for(; i < imax; i++) {
				arr[i] = id + ' ' + arr[i];
			}
			selector = arr.join(',');
			return pref + selector + '{';
		});
	}

	function transformHostCss (css, id) {
		return css.replace(rgx_host, function(full, pref, ext, expr){
			return pref
				+ id
				+ (expr || '')
				+ '{';
		});
	}

	function getScopeIdentity(node, el) {
		var identity = 'scoped__css__' + node.id;
		if (el.id) {
			el.className += ' ' + identity;
			return '.' + identity;
		}
		el.setAttribute('id', identity);
		return '#' + identity;
	}
}());