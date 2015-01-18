var sinon = require('sinon');
var expect = require('sinon-expect').enhance(
	require('expect.js'),
	sinon,
	'was'
);

var route = require('./');

exports.Boulevard = {
	'basic routing': {
		'calls handler on match'() {
			var handler = sinon.spy();
			var r = route({
				'/': handler
			});
			r({url: '/'});
			expect(handler).was.called();
		},

		'passes arguments to handler'() {
			var handler = sinon.spy();
			var req = {url: '/'};
			var r = route({
				'/': handler
			});
			r(req, 'a', 'b');
			expect(handler).was.calledWith(req, 'a', 'b');
		},

		'returns handler return value'() {
			var r = route({
				'/': () => 'foo'
			});
			expect(r({url: '/'})).to.be('foo');
		},

		'parameters': {
			'matches'() {
				var handler = sinon.spy();
				var r = route({
					'/:foo': handler
				});
				r({url: '/bar'});
				expect(handler).was.called();
			},

			'matches complex paths'() {
				var handler = sinon.spy();
				var r = route({
					'/:foo/bar/baz/:quux': handler
				});
				r({url: '/frob/bar/baz/lorem'});
				expect(handler).was.called();
			},

			'sends matched parameters as last argument'() {
				var handler = sinon.spy();
				var r = route({
					'/:foo/bar/baz/:quux': handler
				});
				r({url: '/frob/bar/baz/lorem'});
				expect(handler.lastCall.args[1]).to.eql({
					foo: 'frob',
					quux: 'lorem'
				});
			},
		}
	}
};