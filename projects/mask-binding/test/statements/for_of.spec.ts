import { Mask as mask } from '@core/mask'
import { $renderServer } from '../utils';
const Compo = mask.Compo;


const TestData = {
	simple: {
		template: `
			#container { 
				+for (letter of letters) > 
					span > '~[letter]'
			}
		`,
	
		model: () => ({
			letters: ['A', 'B']
		}),
		
		check ($container, model, ctr) {
			$container.eq_('text', 'AB');
			
			eq_(model.__observers.letters.length, 1);
			model.letters.push('C');
			model.letters.unshift('0');
			$container.eq_('text', '0ABC');
			
			model.letters.splice(1, 2);
			$container.eq_('text', '0C');
			
			ctr.remove();
			eq_(model.__observers.letters.length, 0);
		}
	},
	nested: {
		template: `
			#container {
				+for (x of letters) > div {
					'|~[x.letter]'
					+for (num of x.numbers) > span > '~[num](~[x.letter])'
				}
			}
		`,
		model: () => ({
			letters: [
				{ letter: 'A', numbers: [1, 2]},
				{ letter: 'B', numbers: [1, 2]},
			]
		}),
		check ($container, model, ctr) {
			$container.eq_('text', '|A1(A)2(A)|B1(B)2(B)');
			
			eq_(model.__observers.letters.length, 1);
			
			model.letters[0].numbers.push(3);
			$container.eq_('text', '|A1(A)2(A)3(A)|B1(B)2(B)');
			
			model.letters[0].numbers.splice(0, 1, 0);
			$container.eq_('text', '|A0(A)2(A)3(A)|B1(B)2(B)');
			
			
			model.letters[0].numbers = [5,8];
			$container.eq_('text', '|A5(A)8(A)|B1(B)2(B)');
			
			model.letters.splice(1, 1, {letter: 'C', numbers: [] });
			$container.eq_('text', '|A5(A)8(A)|C');
			
			model.letters[1].numbers = [0];
			$container.eq_('text', '|A5(A)8(A)|C0(C)');
			
			
			model.letters[1].numbers.unshift(-1);
			$container.eq_('text', '|A5(A)8(A)|C-1(C)0(C)');
			
			ctr.remove();
			eq_(model.__observers.letters.length, 0);
		}
	}
};

UTest({
	'Browser': {
		'+for - simple' () {
			TestClient(TestData.simple);
		},
		'+for - nested' () {
			TestClient(TestData.nested);
		},
	},
	'Server': {
		// Backend
		'$config': {
			'http.include': '/test/node.libraries.js'
		},
		
		'+for - simple' () {
			return TestServer(TestData.simple);
		},
		
		'+for - nested' (done) {
			return TestServer(TestData.nested);
		}
	}
});


function TestClient (data) {
	var Ctor = Compo({
		template: data.template,
		model: data.model()
	});
	var app = Compo.initialize(Ctor);
	data.check(app.$, app.model, app);
}

async function TestServer (data) {
	let { el, doc, win } = await $renderServer(data.template, {
		model: data.model()
	});
	
    data.check(
        mask.$(el),
        win.app.model,
        win.app
    );
}