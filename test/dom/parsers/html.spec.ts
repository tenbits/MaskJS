import { renderer_render } from '@core/renderer/exports';

UTest({
	'mixed markup' () {
		var template = `
			<section>
				<h4><mask>i>'Foo'</mask></h4>
			</section>
		`;
		var dom = renderer_render(template);
		return UTest.domtest(dom, `
			find('section>h4>i') >
				text Foo;
		`);
	},
	'html markup' () {
		var template = `<!-- Comment --><ul>
				<li>Foo</li>
				<li>Bar</li>
			</ul>
			<input name='foo-input' />
			<input name='baz-input'>
			<h4>Lorem ipsum doler it semet</h4>
		`;
		var dom = renderer_render(template);
		return UTest.domtest(dom, `
			find('ul > li') {
				length 2;
			}
			filter ('input') {
				length 2;
				eq (0) > attr name foo-input;
				eq (1) > attr name baz-input;
			}
			filter ('h4') > text ('Lorem ipsum doler it semet');
		`);
	}

})