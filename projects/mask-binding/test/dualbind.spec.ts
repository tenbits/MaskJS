import { Mask as mask } from '@core/mask'
const Compo = mask.Compo;

UTest({
	'input text'() {
		var model = <any>{ foo: 'Foo' };
		var Ctor = Compo({
			template: "input > dualbind value=foo",
			model: model,
		});
		var compo = mask.Compo.initialize(Ctor);
		notEq_(compo.$, null);

		var input = compo.$[0];

		eq_(input.value, 'Foo');

		model.foo = 'Baz';
		eq_(input.value, 'Baz');

		input.value = 'Quux';
		mask.$(input).trigger('input');
		eq_(model.foo, 'Quux');

		eq_(compo.components.length, 1);
		eq_(model.__observers.foo.length, 1);

		compo.remove();
		eq_(model.__observers.foo.length, 0);

		'> dispose via jquery'
		var compo = mask.Compo.initialize(Ctor);
		eq_(model.__observers.foo.length, 1);
		compo.$.removeAndDispose();
		eq_(model.__observers.foo.length, 0);
	},

	'input date (debounced)'(done) {
		var model = { foo: new Date(2014, 1, 1) };
		var Ctor = Compo({
			template: "input type=date > dualbind value=foo",
			model: model,
		});
		var compo = mask.Compo.initialize(Ctor);
		var input = compo.$[0];

		checkDates();

		'> change DOM'
		input.value = '2017-04-03';
		mask.$(input).trigger('input');
		var date = checkDates();
		eq_(date.getFullYear(), 2017);

		'> change Object'
		model.foo.setFullYear(2020);
		setTimeout(function () {
			has_(input.value, '2020');
			done();
		});


		function checkDates() {
			var date = new Date(input.value);
			date.setMinutes(date.getTimezoneOffset());

			eq_(date.getFullYear(), model.foo.getFullYear());
			eq_(date.getMonth(), model.foo.getMonth());
			eq_(date.getDate(), model.foo.getDate());
			eq_(date.getTimezoneOffset(), model.foo.getTimezoneOffset());
			eq_(date.getUTCDate(), model.foo.getUTCDate());
			return date;
		}
	},
	'Object Getter/Setter'() {
		var model = {
			foo: 'bob',
			getFoo: assert.await(function (expression, model_, compo_) {
				eq_(model_, model);
				notEq_(compo_, null);

				eq_(expression, 'foo');

				return model.foo.toUpperCase();
			}),
			setFoo: assert.await(function (value, expression, model_, compo_) {
				eq_(model_, model);
				eq_(compo_, compo);
				eq_(expression, 'foo');

				model.foo = value.toLowerCase();
			})
		};
		var Ctor = Compo({
			template: "input > dualbind value=foo obj-getter=getFoo obj-setter=setFoo",
			model: model,
		});
		var compo = mask.Compo.initialize(Ctor);
		var input = compo.$[0];

		// initial value
		eq_(input.value, 'BOB');

		input.value = 'ALICE';
		mask.$(input).trigger('input');

		// changed value
		eq_(model.foo, 'alice');
	},
	'Dom(Component) Getter/Setter'() {
		var model = {
			foo: 'bob'
		};
		mask.registerHandler(':transformer', Compo({
			getValue: assert.await(function (el) {
				return el.value.toLowerCase();
			}),
			setValue: assert.await(function (val, el) {
				el.value = val.toUpperCase();
			})
		}));

		var Ctor = Compo({
			template: `
				:transformer >
					input >
						dualbind value=foo dom-getter=getValue dom-setter=setValue;
			`,
			model: model,
		});

		var compo = mask.Compo.initialize(Ctor);

		var input = compo.$[0];

		// initial value
		eq_(input.value, 'BOB');

		model.foo = 'alice';
		eq_(input.value, 'ALICE');

		input.value = 'JOHN';
		mask.$(input).trigger('change');

		// changed value
		eq_(model.foo, 'john');
	},

	'Dom and Object getter/setters'(done) {
		var model = {
			foo: {
				isPublished: function () {
					return this.publishedState
				},
				setPublished: function (val) {
					this.publishedState = val;
				},
				publishedState: true
			}
		};
		mask.define('BooleanType', Compo({
			tagName: 'input',
			getBool: function (el) {
				if (el.value === 'YES') return true;
				if (el.value === 'NO') return false;
				return null;
			},
			setBool: function (val, el) {
				is_(val, 'Boolean');
				el.value = val ? 'YES' : 'NO';
			}
		}));

		var Ctor = Compo({
			template: `
				BooleanType {
					dualbind (foo.publishedState)
						dom-getter=getBool
						dom-setter=setBool
						obj-getter='foo.isPublished'
						obj-setter='foo.setPublished'
				}
			`,
			model: model,
		});

		var compo = mask.Compo.initialize(Ctor);

		var input = compo.$[0];

		setTimeout(function () {

			model.foo.publishedState = false;
			eq_(compo.$.val(), 'NO');

			model.foo.publishedState = true;
			eq_(compo.$.val(), 'YES');

			compo.$.val('NO').trigger('change');
			eq_(model.foo.publishedState, false);

			compo.$.val('YES').trigger('change');
			eq_(model.foo.publishedState, true);

			done();
		}, 50);
	},

	'should bind to scope'() {
		var template = `
			define Foo {
				var letter = 'A';

				input > dualbind value='$scope.letter';
			};
			Foo;
		`;

		var app = Compo.initialize(template, { letter: 'X' });

		var foo = app.find('Foo');
		is_(foo, 'Object');
		is_(foo.scope.__observers.letter, 'Array');
		eq_(foo.scope.__observers.letter.length, 1);

		eq_(foo.scope.letter, 'A');
		foo
			.$
			.eq_('val', 'A');

		foo.scope.letter = 'B';
		foo
			.$
			.eq_('val', 'B');

		foo.$.val('C');
		foo
			.$
			.eq_('val', 'C')
			.trigger('change');

		is_(app.model.$scope, null);
		eq_(foo.scope.letter, 'C');

		app.remove();
		eq_(foo.scope.__observers.letter.length, 0);
	},
	async 'should observe components property'() {
		var template = `
            define Foo {
                var myLetter = 'a';
                span > '~[bind: this.myLetter]'
                @placeholder;
            };

            Foo {
                dualbind value='letter' property='myLetter' dom-supports-default;
            }
        `;

		let model = { letter: null };
		let parent = Compo.initialize(template, model);
		let foo = Compo.find(parent, 'Foo');

		await pause(20)

		eq_(foo.myLetter, 'a');
		eq_(model.letter, 'a', 'Must got from component as initial was null');

		foo.myLetter = 'b';
		eq_(model.letter, 'b');
	},
	'mappings': {
		'should map to dom and to object'() {
			var template = `
				define Foo {
					function upperCaseLetter (c) {
						return c.toUpperCase()
					}
					function appendSlash (str) {
						return str + '/'
					}

					input > dualbind (letter)
						map-to-dom='this.upperCaseLetter'
						map-to-obj='this.appendSlash';
				};
				Foo;
			`;

			'> to dom'
			var foo = Compo.initialize(template, { letter: 'f' });
			foo
				.$
				.filter('input')
				.eq_('length', 1)
				.eq_('val', 'F');

			'> to letter'
			foo.model.letter = 'q';
			foo
				.$
				.filter('input')
				.val('q')
				.change();

			eq_(foo.model.letter, 'q/');
		},
		'should map to dom and to object using own methods'() {
			var template = `
				define FooOwn {
					input > dualbind (letter)
						map-to-dom='this.upperCaseLetter'
						map-to-obj='this.appendSlash' {
							function upperCaseLetter (c) {
								return c.toUpperCase()
							}
							function appendSlash (str) {
								return str + '/'
							}
						}
				};
				FooOwn;
			`;

			'> to dom'
			var foo = Compo.initialize(template, { letter: 'f' });
			foo
				.$
				.filter('input')
				.eq_('length', 1)
				.eq_('val', 'F');

			'> to letter'
			foo.model.letter = 'q';
			foo
				.$
				.filter('input')
				.val('q')
				.change();

			eq_(foo.model.letter, 'q/');
		}
	}
})


function pause(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
