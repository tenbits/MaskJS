import { jMask as $ } from '../src/jmask/jMask'

UTest({
	'child nestings' (){
		var div = $('div { \
				section { span; span; ul; } \
				h4 { span; tt; } \
			}');
		
		[
			['section', 1],
			['section > *', 3],
			['section > span', 2],
			['> section > *', 3],
			['> h4 > *', 2],
			['> h4 > tt', 1],
			['> h4 > div', 0],
			['> * > *', 5],
			['> section > span', 2],
			['> section > ul', 1],
			
		].forEach(function(x){
			check(x[0], x[1]);
		});
		
		function check(selector, expect){
			eq_(div.find(selector).length, expect, '`' + selector + '`');
		}
	},
	
	'select textNodes' (){
		var div = $('div { \
				section { "Foo" "Bar" } \
				h4 > "Baz" \
			}');
		
		[
			['section >   	*', 2],
			['h4>*', 1],
		].forEach(function(x){
			check(x[0], x[1]);
		});
		
		function check(selector, expect){
			eq_(div.find(selector).length, expect, '`' + selector + '`');
		}
	},
	
	'all siblings' (){
		var div = $('div { \
				section { span > span > br; ul; } \
				h4 { span; tt; } \
			}');
		
		[
			['span', 3],
			['h4 span', 1],
			['section span', 2],
			['section br', 1]
			
		].forEach(function(x){
			check(x[0], x[1]);
		});
		
		function check(selector, expect){
			eq_(div.find(selector).length, expect, '`' + selector + '`');
		}
	},
	'pseudo': {
		'select text' () {
			var div = $("div; 'Hello'");
			eq_(div.length, 2);
			
			var text = div.filter('::text');
			eq_(text.length, 1);
			eq_(text.text(), 'Hello');
		},
		'selector not' () {
			var set = $("div; span;");
			eq_(set.length, 2);
			
			var span = set.filter('::not(div)');
			eq_(span.length, 1);
			eq_(span[0].tagName, 'span');
		}
	},
	'shoud match by function' () {
		var set = $("div;span;section;");
		var span = set.first(node => node.tagName === 'span');
		eq_(span.length, 1);
		eq_(span.get(0).tagName, 'span');
	}
});
