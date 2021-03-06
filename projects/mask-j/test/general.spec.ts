import { jMask as $ } from '../src/jmask/jMask'

UTest({
	'lib' (){		
		eq_(typeof $, 'function', 'Compo.jmask is not a function');
	},
	'div (attr)' () {
		var div = $('div');

		eq_(div.length, 1, 'shoud contain one item');
		// attr
		div.attr('key', 'xvalue');
		eq_(div.attr('key'), 'xvalue', 'shoud have key="xvalue" attr');
		
		div.removeAttr('key');
		eq_(div.attr('key'), null, 'shoud have no key attr');
		
		div.prop('key', 'xvalue');
		eq_(div.prop('key'), 'xvalue', 'shoud have key="xvalue" prop');
		
		div.removeProp('key');
		eq_(div.prop('key'), null, 'shoud have no key prop');

		// class
		div.addClass('myclass');
		eq_(div.attr('class'), 'myclass', 'shoud have class="myclass" attr');
		eq_(div.hasClass('myclass'), true, 'shoud have myclass class');
		
	
		div.addClass('other');
		eq_(div.attr('class'), 'myclass other', 'shoud have class="myclass other" attr');
		eq_(div.hasClass('myclass'), true, 'shoud have myclass class');
		eq_(div.hasClass('other'), true, 'shoud have other class');

		div.removeClass('myclass');
		eq_(div.attr('class'), 'other', 'shoud have class="myclass other" attr');
		eq_(div.hasClass('myclass'), false, 'shouldnt have myclass class');
		eq_(div.hasClass('other'), true, 'shoud have other class');

		div.toggleClass('myclass');
		eq_(div.attr('class'), 'other myclass', 'shoud have class="other myclass" attr');
		eq_(div.hasClass('myclass'), true, 'shoud have myclass class');
		eq_(div.hasClass('other'), true, 'shoud have other class');

		div.removeClass('other');
		eq_(div.attr('class'), 'myclass', 'shoud have class="other myclass" attr');
		eq_(div.hasClass('myclass'), true, 'shoud have myclass class');

		eq_(div.hasClass('other'), false, 'shouldnt have other class');

		// css
		div.css('width', '10px');

		eq_(div.attr('style'), 'width:10px;', 'should have style="width:10px" attr');
		eq_(div.css('width'), '10px', 'should have 10px for width');

		div.css({
			height: '20px',
			color: '#fff'
		});
		eq_(div.css('color'), '#fff', 'should have #fff for color');
		eq_(div.css('width'), '10px', 'should have 10px for width');

		div.attr('style', 'font-weight:bold;');
		eq_(div.css('width'), null, 'shouldnt have 10px for width');
		eq_(div.css('font-weight'), 'bold', 'should have bold for font-weight');
	},
	'div (manip clone/append/remove/attr/class)' () {
		var div = $('div style="font-weight:bold"');

		eq_(div.clone().css('font-weight'), 'bold', 'cloned shoud have font-weight as bold');

		div.append('span');
		eq_(div.children().length, 1, 'div should have 1 child');

		div.append('table');

		eq_(div.children().length  , 2, 'div should have 2 childs');
		eq_(div.children('span').length  , 1, 'div should have 1 span child');
		eq_(div.find('span').length  , 1, 'div should have 1 span child');

		div.children('span').attr('id', 'spanny');
		eq_(div.find('#spanny').length  , 1, 'div should have 1 child with id spanny');

		div.children('table').append('button');
		eq_(div.find('span').children().length  , 0, 'span should have no children');
		eq_(div.find('table').children().length  , 1, 'table shoud have one child');


		div.children().addClass('classy');
		eq_(div.children().eq(0).hasClass('classy'), true, 'Span shoud have class classy');
		eq_(div.children().eq(1).hasClass('classy'), true, 'Table shoud have class classy');

		div.children('table').remove();
		eq_(div.children().length  , 1, 'Shoud contain 1 child after .remove call');


		eq_(div.prepend('ul > li > "hello"').children().eq(0).get(0).tagName  , 'ul', 'First child shoud be UL');


		eq_(div.empty().children().length  , 0, 'Shoud have no childs after .empty');
	},

	'div (stringify)' (){
		var div = $('div style="color:#fff" > span > ul > li > "Name";'),
			str = div.mask();

		var div2 = $(str);

		assert.equal(str, div2.mask(), 'Two markups should be equal');

	},
	'div (text)' (){
		var div = $('div { "hello" " world!" }');

		assert.equal('hello world!', div.text());
		assert.equal('new', div.text('new').text());

		div = $('div { "hello" " ~[html]!" }');
		assert.equal('hello <span>1</span>!', div.text({html: '<span>1</span>'}));

	},
	'divs (manip)' (){
		var div = $('div;div;');

		assert.equal($('div {div; div;}').mask(), div.wrapAll('div').mask(), 'wrappAll failed');

		assert.equal($('div > div; div > div;').mask(), div.wrap('div').mask(), 'wrap failed');
	},

	'selectors (filter)' (){
		var div = $('div; div name="xx"; span#spany.classy.class;');

		function filter(selector, expect) {
			eq_(div.filter(selector).length, expect, 'Selector Failed:"' + selector + '"');
		}

		filter('div', 2);
		filter('span', 1);
		filter('[name=xx]', 1);
		filter('div[name="xx"]', 1);
		filter('div[name=xx]', 1);
		filter('span[name="xx"]', 0);
		filter('div[name="xxx"]', 0);

		filter('.classy', 1);
		filter('.classy.class', 1);
		filter('.classy.none', 0);

		filter('div[id=spany]', 0);
		filter('.classy', 1);
	}
});
