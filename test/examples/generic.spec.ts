UTest({
	'syntax': function(done){
		
		return UTest
			.server
			.request('/examples/syntax.html')
			.done(function(doc, win){
				
				var $dom = $(doc.body),
					text = $dom.text()
					;
					
				has_(text, 'Hello World');
				has_(text, 'Lorem ipsum');
				has_(text, "With' quote inside");
				
				$dom
					.has_('h1#foo')
					.has_('h2 > span', 1)
					.has_('h3 > span', 2)
					;
			});
	},
	
	'statements': function(done){
		
		return UTest
			.server
			.request('/examples/statements.html')
			.done(function(doc, win){
				
				var $dom = $(doc.body);
				
				$dom
					.has_('.if-one')
					
					.hasNot_('.if-none')
					.has_('.if-one-else')
					
					.has_('.for-of', 4)
					.has_('.for-in', 4)
					.has_('.each', 2)
					;
				
				$dom
					.has_('.switch-expect')
					.hasNot_('.switch-not-expect')
					;
				
				$dom
					.find('.for-of')
					.has_('text','foo')
					.has_('text','baz')
					;
				
				$dom
					.find('.for-in')
					.has_('text', 'theme: default')
					.has_('text', 'amount: 2')
					;
				
				$dom
					.find('.each')
					.has_('text', 'foo')
					.has_('text', 'baz')
					;
			})
	},
	
	'interpolation': function(){
		return UTest
			.server
			.request('/examples/interpolation.html')
			.done(function(doc, win){
				var $dom = $(doc.body);
				
				$dom
					.find('.model > div')
					.eq_('text', 'Section: Interpolations')
					;
				$dom
					.find('.model > small')
					.eq_('text', 'interpolations')
					;
				
				$dom
					.has_('.user-compo')
					.find('.user-compo > h6')
					.eq_('text', '"User" Component')
					;
				$dom
					.find('.user-compo > .user-date')
					.eq_('text', '2014-0')
					;
				
				$dom
					.find('select#themes > option')
					.eq_('length', 2)
					.eq_('text', 'defaultdark')
					;
				
				$dom
					.find('.settings')
					.eq_('text', 'Settings 100')
					;
			});
	},
	
	'component': function() {
		return UTest
			.server
			.request('/examples/component.html')
			.done(function(doc, win){
				
				var $dom = $(doc.body),
					$status = $dom.find('.status')
					;
				
				$dom
					.find('input')
					.eq_('val', 'Baz')
					;
				$dom
					.find('textarea')
					.eq_('val', 'Lorem')
					;
				$status
					.eq_('length', 1)
					.eq_('text', '')
					;
				
				'> event'
				$dom
					.find('.test-event')
					.click();
				$status
					.eq_('text', 'testEventHandled')
					;
					
				'> signal'
				$dom
					.find('.test-signal')
					.click();
				$status
					.eq_('text', 'testSlotHandled')
					;
				
				'> app'
				var profile = win.app.find('UserProfile');
				notEq_(profile, null);
				
				'> dualbind:input'
				'> dom change'
				
				// use jquery from iframe to locate events
				win.$($dom[0])
					.find('input')
					.val('Qux')
					.trigger('keyup')
					;
				$status
					.eq_('text', 'usernameChanged Qux')
					;
				eq_(profile.model.username, 'Qux');
				
				'> model change'
				profile.model.username = 'Bob';
				$dom
					.find('input')
					.eq_('val', 'Bob')
					;
			});
	}
})