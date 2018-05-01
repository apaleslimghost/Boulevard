const sinon = require('sinon');
const expect = require('sinon-expect').enhance(
	require('expect.js'),
	sinon,
	'was'
);

const {param, branch} = require('param-trie');
const route = require('./');

exports.Boulevard = {
	'basic routing': {
		'calls handler on match'() {
			const handler = sinon.spy();
			const r = route({
				'/': handler
			});
			r({url: '/'});
			expect(handler).was.called();
		},

		'passes arguments to handler'() {
			const handler = sinon.spy();
			const req = {url: '/'};
			const r = route({
				'/': handler
			});
			r(req, 'a', 'b');
			expect(handler).was.calledWith(req, 'a', 'b');
		},

		'returns handler return value'() {
			const r = route({
				'/': () => 'foo'
			});
			expect(r({url: '/'})).to.be('foo');
		},

		'parameters': {
			'matches'() {
				const handler = sinon.spy();
				const r = route({
					'/:foo': handler
				});
				r({url: '/bar'});
				expect(handler).was.called();
			},

			'matches complex paths'() {
				const handler = sinon.spy();
				const r = route({
					'/:foo/bar/baz/:quux': handler
				});
				r({url: '/frob/bar/baz/lorem'});
				expect(handler).was.called();
			},

			'sends matched parameters as last argument'() {
				const handler = sinon.spy();
				const r = route({
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
			const res = {end() {}};
			sinon.spy(res, 'end');

			const r = route({
				'/'() {}
			});
			r({url: '/nope'}, res);

			expect(res.end).was.called();
			expect(res.statusCode).to.be(404);
		}
	},

	'custom behaviour': {
		'404'() {
			const four = sinon.spy();
			const myRoute = route.withFourOhFour(four);
			const r = myRoute({
				'/'() {}
			});
			const req = {url: '/nope'};
			r(req, 'a', 'b');

			expect(four).was.calledWith(req, 'a', 'b');
		},

		'getUrl'() {
			const get = sinon.stub().returns('/');
			const handler = sinon.spy();
			const myRoute = route.withGetUrl(get);
			const r = myRoute({
				'/': handler
			});
			r('a', 'b');
			expect(get).was.calledWith('a', 'b');
			expect(handler).was.called();
		},

		'addParams'() {
			const add = sinon.stub().returns(['a', 'b']);
			const myRoute = route.withAddParams(add);
			const handler = sinon.spy();
			const r = myRoute({
				'/:bar': handler
			});
			const req = {url: '/foo'};
			r(req, 'c', 'd');

			expect(add).was.calledWith({bar: 'foo'}, [req, 'c', 'd']);
			expect(handler).was.calledWith('a', 'b');
		},

		'all at once'() {
			const four = sinon.spy();
			const add = sinon.stub().returns(['a', 'b']);
			const handler = sinon.spy();

			const r = route.route_({
				fourOhFour: four,
				addParams: add
			}, {
				'/foo/:bar': handler
			});

			const req = {url: '/nope'};
			r(req, 'a', 'b');

			expect(four).was.calledWith(req, 'a', 'b');

			const req2 = {url: '/foo/bar'};
			r(req2, 'c', 'd');

			expect(add).was.calledWith({bar: 'bar'}, [req2, 'c', 'd']);
			expect(handler).was.calledWith('a', 'b');
		}
	},

	'routes map': {
		'can be an array of pairs'() {
			const handler = sinon.spy();
			const r = route([
				['/', handler]
			]);
			r({url: '/'});
			expect(handler).was.called();
		},

		'multiple routes at same path allows fallback'() {
			const handler = sinon.spy();
			const r = route([
				['/', () => false],
				['/', handler]
			]);
			r({url: '/'});
			expect(handler).was.called();
		},

		'supports uncompiled paths': {
			'base'() {
				const handler = sinon.spy();
				const r = route([
					[[], handler]
				]);
				r({url: '/'});
				expect(handler).was.called();
			},
			'more'() {
				const handler = sinon.spy();
				const r = route([
					[[branch('foo')], handler]
				]);
				r({url: '/foo'});
				expect(handler).was.called();
			},
			'param'() {
				const handler = sinon.spy();
				const r = route([
					[[param('foo')], handler]
				]);
				r({url: '/bar'});
				expect(handler).was.called();
				expect(handler.lastCall.args[1]).to.eql({
					foo: 'bar'
				});
			}
		}
	},

	'router methods': {
		'add': {
			'should add routes to the handler'() {
				const foo = sinon.spy();
				const bar = sinon.spy();
				const r = route({
					'/foo': foo
				});
				r.add({
					'/bar': bar
				});

				r({url: '/bar'});
				expect(bar).was.called();

				r({url: '/foo'});
				expect(foo).was.called();
			}
		},

		'concat': {
			'should join two routers'() {
				const foo = sinon.spy();
				const bar = sinon.spy();
				const r = route({
					'/foo': foo
				});
				const s = route({
					'/bar': bar
				});

				const t = r.concat(s);

				t({url: '/bar'});
				expect(bar).was.called();

				t({url: '/foo'});
				expect(foo).was.called();
			}
		},

		'use': {
			'should add a router at a subpath'() {
				const foo = sinon.spy();
				const bar = sinon.spy();
				const r = route({
					'/foo': foo
				});
				const s = route({
					'/bar': bar
				});

				const t = r.use('/baz', s);

				t({url: '/bar'}, {end() {}});
				expect(bar).was.notCalled();

				t({url: '/baz/bar'});
				expect(bar).was.called();

				t({url: '/baz/bar'});
				expect(bar).was.called();

				t({url: '/foo'});
				expect(foo).was.called();
			}
		}
	}
};
