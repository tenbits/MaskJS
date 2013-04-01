var render = function(template, model){
		var html = mask.render(template, model),
			div = document.createElement('div'),
			frag = document.createDocumentFragment();

		div.innerHTML = html;

		if (div.childNodes.length === 1){
			return div.firstChild;
		}
		var element = div.firstChild;
		while(element){
			frag.appendChild(element);
			element = element.nextSibling;
		}

		return frag;

	},
	template, node, attr;

buster.testCase("Render (HTML)", {
	'className is "test"': function() {
		var dom = render('div > div.test');

		assert(dom.querySelector('.test') != null);
	},
	'right model insertion': function() {
		var div = render('div#~[id].~[klass] data-type="~[type]" > "~[name]"', {
			name: 'NAME',
			id: 'ID',
			klass: 'CLASS',
			type: 'TYPE'
		});

		assert(div != null, 'DIV not rendered');
		assert(div.tagName === 'DIV', 'right DIV not redered');


		assert(div.getAttribute('id') == 'ID', 'id is not ID');
		assert(div.getAttribute('class') == 'CLASS', 'class is not CLASS');
		assert(div.getAttribute('data-type') == 'TYPE', 'data-type is not TYPE');

		assert(div.textContent == 'NAME', 'text is not NAME');
	},
	'right text interpolation': function(){
		var div = render('"~[name]~[id] i ~[klass]am~[type]end"', {
			name: 'NAME',
			id: 'ID',
			klass: 'CLASS',
			type: 'TYPE'
		});
		assert(div.textContent == 'NAMEID i CLASSamTYPEend', 'text was not proper interpolated');
	},
	'right model insertion with check': function(){
		var dom = render('div.~[:enabled?"enabled":"disabled"]', {
			enabled: true
		});

		assert(dom.getAttribute('class') == 'enabled', 'div has no "enabled" class');
	},

	'tag-less template check': function(){
		var dom = render('.~[:enabled?"enabled":"disabled"] { .item; .item; .item > "Last" }', {
			enabled: true
		});

		assert(dom != null, 'Div with .enabled class not rendered');
		assert(dom.getAttribute('class') === 'enabled', 'Div shoud have class "enabled"');

		assert(dom.querySelectorAll('.item').length === 3, 'Div should have 3 childs with class .item');
		assert(dom.querySelectorAll('.item')[2].textContent == 'Last', 'Last Div should have text "Last"');
	}
})