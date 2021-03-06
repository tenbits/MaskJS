import { Mask as mask } from '@core/mask'
const Compo = mask.Compo;

declare var sinon: sinon.SinonStatic

UTest({
	'should attach the function to instance' () {
		var spyInner = sinon.spy();
		var spyOuter = sinon.spy();

		var foo: any = new (Compo({
			someFn: spyInner
		}));

		Compo.attach(foo, 'someFn', spyOuter);
		foo.someFn('bar', 2);

		const expect = [['bar', 2]];
		eq_(spyInner.callCount, 1);
		deepEq_(spyInner.args, expect);
		deepEq_(spyOuter.args, expect);
	}
})