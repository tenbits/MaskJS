import { Mask as mask } from '@core/mask';
const Compo = mask.Compo;

declare var sinon: sinon.SinonStatic


UTest({
	'should emit piped signal on click' () {
		mask.registerHandler('Foo', Compo({
			pipes: {
				testy: {
					foo: assert.await()
				}
			}
		}));
		
		var div = mask.render(`
			Foo > button x-pipe-signal='click: testy.foo';
		`);
		
		return UTest.domtest(div, `
			find(button) > do click;
		`);
	},
	'should manually fire the piped signal with arguments' () {
		var spy = sinon.spy();
		mask.registerHandler('Foo', Compo({
			pipes: {
				testy: {
					foo: spy
				}
			}
		}));
		
		var compo = Compo.initialize('a > Foo');		
		Compo.pipe('testy').emit('foo', 1, 'qux');
		
		compo.remove();
		Compo.pipe('testy').emit('foo', 2, 'quxy');
		
		eq_(spy.callCount, 1);
		deepEq_(spy.args[0], [1, 'qux']);
	}
})