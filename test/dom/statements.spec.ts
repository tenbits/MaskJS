import { renderer_render } from '@core/renderer/exports'
import '@core/statements/exports'

function $render(template, model?, ctx?, container?, ctr?){
    let frag = renderer_render(template, model, ctx, container, ctr);    
	return $(frag);
}

UTest({
	
	'if': function(){
		[
			{
				template: 'if (1) > "foo"',
				result: 'foo'
			},
			{
				template: 'if (0) > "foo" else > "bar"',
				result: 'bar'
			},
			{
				template: 'if (i/2 == 1) > "foo" else > "bar"',
				model: { i: 2 },
				result: 'foo'
			},
			{
				template: 'div; span { if (i/2 * 2 == 1) { "foo" } else { "b" "a" "r" }}',
				model: { i: 2 },
				result: 'bar'
			},
			{
				template: `
					if (Id) > 'A'
					else > 'B'
					
					if (!Id) > 'C'
					else > 'D'
				`,
				model: { Id: true },
				result: 'AD'
			},
			{
				template: `
					if (Id == 1) > span > 'A'
					else > span > 'B'
					
					if (Id == 1) > span > 'C'
					else (Id == 3) > span > 'D'
					else (Id == 2) > span > 'E'
					else  > span > 'F'
				`,
				model: { Id: 2 },
				result: 'BE'
			}
		]
		.forEach(function(test){
			
			var $frag = $render(
				test.template
				, test.model
				, null
				, null
				, (<any>test).controller
			);
			eq_($frag.text(), test.result);
		});
		
	},
	
	'for': function(){
		[
			{
				template: 'for (x of items) > "~[x]"',
				model: {
					items: ['1', '2', '3']
				},
				result: '123'
			},
			{
				template: 'for (  x  of  items) > "~[name]~[x]"',
				model: {
					items: ['1', '2', '3'],
					name: '-'
				},
				result: '-1-2-3'
			},
			{
				template: 'for ( (item, index) of items ) > "~[name]~[item](~[index])"',
				model: {
					items: ['1', '2', '3'],
					name: '-'
				},
				result: '-1(0)-2(1)-3(2)'
			},
			{
				template: 'for ( key in items ) > "~[name]~[key]"',
				model: {
					items: {
						a: 'A',
						b: 'B'
					},
					name: '-'
				},
				result: '-a-b'
			},
			{
				template: 'for ( (key, value) in items ) > "~[name]~[key](~[value])"',
				model: {
					items: {
						a: 'A',
						b: 'B'
					},
					name: '-'
				},
				result: '-a(A)-b(B)'
			}, 
		]
		.forEach(function(test){
			
			var $frag = $render(
                test.template, 
                test.model, 
                null, 
                null, 
                (<any>test).controller
            );
			eq_($frag.text(), test.result);
		})
	},
	
	'each': function(){
		[
			{
				template: 'each (items) > span > "~[.]"',
				model: {
					items: ['1', '2', '3']
				},
				result: '123'
			},
			{
				template: 'each (items) > span > "-~[.](~[index])"',
				model: {
					items: ['1', '2', '3']
				},
				result: '-1(0)-2(1)-3(2)'
			}
		]
		.forEach(function(test){
			
			var $frag = $render(
                test.template, 
                test.model, 
                null, 
                null, 
                (<any>test).controller
            );
			eq_($frag.text(), test.result);
		});
	},
	
	'with': function(){
		[
			{
				template: 'with (foo.bar) > "~[.]"',
				model: {
					foo: {
						bar: 'bar'
					}
				},
				result: 'bar'
			},
			{
				template: 'with (baz()) > "~[.]"',
				controller: {
					scope: {
						baz: function(){
							return 'baz'
						}
					}
				},
				result: 'baz'
			}
		]
		.forEach(function(test){
			
			var $frag = $render(
                test.template, 
                test.model, 
                null, 
                null, 
                (<any>test).controller
            );
			eq_($frag.text(), test.result);
		})
	},
	
	'switch': function(){
		[
			{
				template: 'switch (foo.bar) { case ("foo") > "foo"; case ("bar") > "bar" }',
				model: {
					foo: {
						bar: 'bar'
					}
				},
				result: 'bar'
			},
			{
				template: 'switch (baz()) { case ("foo")  > "f"; default > "baz" }',
				controller: {
					scope: {
						baz: function(){
							return 'baz'
						}
					}
				},
				result: 'baz'
			}
		]
		.forEach(function(test){
			
			var $frag = $render(
                test.template, 
                test.model, 
                null, 
                null, 
                test.controller
            );
			eq_($frag.text(), test.result);
		})
	},
	
	
	'visible' () {
		var template = `
			section >
				for ((letter, index) of letters)>
					visible(index % 2 === 0) >
						span name='~[letter]' data-index='~[index]';
		`;
		
		var model = {
			letters: [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
		};
		var $dom = $render(template, model);
		
		$dom
			.find('span')
			.eq_('length', model.letters.length)
			.each(function(){
				var letter = this.getAttribute('name');
				var i = model.letters.indexOf(letter);
				var visible = i / 2 === 0;
				
				$(this)
					[i % 2 === 0 ? 'notEq_' : 'eq_']
					('css', 'display', 'none');
			});
		
	},
	
	'repeat': (function(){
		function check(dom) {
			return UTest.domtest(dom, `
				find('span') > length 4;
				
				find('span:eq(0)') >
					text ('Foo0; 1');
				
				find('span:eq(1)') >
					text ('Foo1; 2');
					
				find('span:eq(2)') >
					text ('Foo2; 3');
					
				find('span:eq(3)') >
					text ('Foo3; 4');
			`);
		}
		return {
			'simple' () {
				var template = `
					section >
						repeat (0..4) >
							span > '~[: name + index ]; ~[: number + index]'
				`;
				
				var dom = renderer_render(template, {
					name: 'Foo',
					number: 1
				});
				
				return check(dom);
			},
			'from model' () {
				var template = `
					section >
						repeat (0..count) >
							span > '~[: name + index ]; ~[: number + index]'
				`;
				
				var dom = renderer_render(template, {
					count: 4,
					name: 'Foo',
					number: 1
				});
				return check(dom);
			}
		};
	}())
	
})

