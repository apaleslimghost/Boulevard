const ParamTrie = require('param-trie');
const {middleware} = require('@quarterto/middleware');
const {param, branch} = ParamTrie;

const nextRouteSymbol = Symbol.for('boulevard-next-route');
const contextSymbol = Symbol.for('boulevard-context');

exports.nextRoute = nextRouteSymbol;

const splitPath = path => path.split('/').filter(part => part.length)

const compilePath = path => splitPath(path).map(part =>
	  part.startsWith(':') ? param(part.slice(1))
	: branch(part));

const compileAll = routes => Object.keys(routes).reduce(
	(map, path) => map.set(compilePath(path), routes[path]),
	new Map()
);

const getPath = ({url}) => url;
const addParams = (args, params) => args.concat([params]);
const fourOhFour = ({url}) => { throw new Error(`${url} not found`) };

const trieRouter = trie => Object.assign(function(...args) {
	const path = splitPath(getPath(...args));
	const resolvedRoutes = trie.lookup(path).map(
		({value, params}) => (...args) => value(...addParams(args, params))
	);

	if(resolvedRoutes.length === 0) return fourOhFour(...args);

	return middleware(resolvedRoutes, {
		nextSymbol: nextRouteSymbol,
		nextSymbols: [nextRouteSymbol],
		contextSymbol,
	}).apply(this, args);
}, {trie});

const trieMethod = f => function (router) {
	return trieRouter(f(this.trie, router.trie));
};

const methods = {
	use(path, router) {
		if(typeof path === 'function') {
			return this.merge(router);
		}

		return this.add(path, router.trie);
	},

	merge(other) {
		return trieRouter(this.trie.merge(router.trie));
	},

	add(path, fn) {
		return trieRouter(this.trie.insertPath(path, fn));
	}
}

const route = routes => trieRouter(ParamTrie.fromMap(compileAll(routes)));

module.exports = route;