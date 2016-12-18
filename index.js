const {ParamTrie, ParamBranch} = require('param-trie');
const url = require('url');
const jalfrezi = require('jalfrezi');

const {Some, None} = Option;
const {Param, Branch} = ParamBranch;

function urlToPath(url) {
	return url.split('/').filter((p) => p.length > 0);
}

function toParamBranch(url) {
	if(Array.isArray(url)) {
		return url; // precompiled
	}

	return urlToPath(url).map(function(part) {
		return part[0] === ':'? Param(part.slice(1))
		     : /* otherwise */  Branch(part);
	});
}

const chain = (xs, f) => xs.reduce(
	(ys, x) => ys.concat(f(x)),
	[]
);

const toPairsObj = (obj) => μ.Map(obj).entrySeq().toJS();

const toPairsItem = (item) => Array.isArray(item)? [item]
                            : /* otherwise */      toPairsObj(item);

const toPairs = (map) => Array.isArray(map)? chain(map, toPairsItem)
                       : /* otherwise */     toPairsObj(map);

const groupPairsUniq = (pairs) => pairs.reduce(
	(groups, [k, v]) => {
		const i = groups.findIndex((m) => !m.has(k));
		return groups.setIn([i >= 0 ? i : groups.size, k], v);
	},
	μ.List()
);

function compileAll(maps) {
	return groupPairsUniq(toPairs(maps)).map(compile).reduce(
		(a, b) => a.merge(b),
		ParamTrie.empty()
	);
}

function compile(map) {
	return ParamTrie.fromMap(map.mapKeys(toParamBranch));
}

function resultToOption(result) {
	return typeof result === 'undefined'? Some(undefined)
	     : result instanceof Option?      result
	     : result === false?              None
	     : /* otherwise */                Some(result);
}

function handleAndFold(args, addParams, results) {
	for(let {value, params} of results) {
		for(let handler of value) {
			let result = resultToOption(
				handler(...addParams(params.toJSON(), args))
			);

			if(result instanceof Some) {
				return result;
			}
		}
	}
	return None;
}

function fourOhFour$(req, res) {
	res.statusCode = 404;
	res.end();
}

function addParams$(params, args) {
	return args.concat(params);
}

function getUrl$(req) {
	return url.parse(req.url).pathname;
}

const defaultFuncs = {
	fourOhFour: fourOhFour$,
	addParams:  addParams$,
	getUrl:     getUrl$
};

function createHandler(options, trie) {
	const {
		fourOhFour,
		addParams,
		getUrl
	} = options;

	const currentTrie = trie;

	function handle$(...args) {
		return handleAndFold(
			args,
			addParams,
			currentTrie.lookup(urlToPath(getUrl(...args)))
		).fold(
			(a) => a,
			()  => fourOhFour(...args)
		);
	}

	handle$.routes = function() {
		return currentTrie;
	};

	handle$.add = function(moreRoutes) {
		const newTrie = compileAll(moreRoutes);
		currentTrie = currentTrie.merge(newTrie);
	};

	handle$.concat = function(otherRouter) {
		return concatRoutes(otherRouter.routes());
	};

	function concatRoutes(routes) {
		return createHandler(options, currentTrie.merge(routes));
	}

	handle$.use = function(path, otherRouter) {
		return concatRoutes(otherRouter.routes().indent(toParamBranch(path)));
	};

	return handle$;
}

function route(options, map) {
	return createHandler(options, compileAll(map));
}

route.displayName = 'route';
module.exports = jalfrezi(defaultFuncs, route);

// 1.0 backwards compat
module.exports.with404 = module.exports.withFourOhFour;
module.exports.withParamHandler = module.exports.withAddParams;
