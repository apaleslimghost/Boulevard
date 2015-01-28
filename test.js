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
		},

		'404'() {
			var res = {end() {}};
			sinon.spy(res, 'end');

			var r = route({
				'/'() {}
			});
			r({url: '/nope'}, res);

			expect(res.end).was.called();
			expect(res.statusCode).to.be(404);
		}
	},

	'custom behaviour': {
		'404'() {
			var four = sinon.spy();
			var myRoute = route.withFourOhFour(four);
			var r = myRoute({
				'/'() {}
			});
			var req = {url: '/nope'};
			r(req, 'a', 'b');

			expect(four).was.calledWith(req, 'a', 'b');
		},

		'getUrl'() {
			var get = sinon.stub().returns('/');
			var handler = sinon.spy();
			var myRoute = route.withGetUrl(get);
			var r = myRoute({
				'/': handler
			});
			r('a', 'b');
			expect(get).was.calledWith('a', 'b');
			expect(handler).was.called();
		}
	}
};