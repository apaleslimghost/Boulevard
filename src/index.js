var {ParamTrie, ParamBranch} = require('param-trie');
var μ = require('immutable');
var Option = require('fantasy-options');
var Symbol = require('es6-symbol');
var url = require('url');
var jalfrezi = require('jalfrezi');
var Iterator = require('es6-iterator');

var {Some, None} = Option;
var {Param, Branch} = ParamBranch;

function urlToPath(url) {
	return url.split('/').filter((p) => p.length > 0);
}

function toParamBranch(url) {
	return urlToPath(url).map(function(part) {
		return part[0] === ':'? Param(part.slice(1))
		     : /* otherwise */  Branch(part);
	});
}

var chain = (xs, f) => xs.reduce(
	(ys, x) => ys.concat(f(x)),
	[]
);

var toPairsObj = (obj) => μ.Map(obj).entrySeq().toJS();

var toPairsItem = (item) => Array.isArray(item)? [item]
                          : /* otherwise */      toPairsObj(item);

var toPairs = (map) => Array.isArray(map)? chain(map, toPairsItem)
                     : /* otherwise */     toPairsObj(map);

var groupPairsUniq = (pairs) => pairs.reduce(
	(groups, [k, v]) => {
		var i = groups.findIndex((m) => !m.has(k));
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
	return typeof result === 'undefined'? Some({})
	     : result instanceof Option?      result
	     : result === false?              None
	     : /* otherwise */                Some(result);
}

function handleAndFold(args, addParams, results) {
	for(let {value, params} of Iterator(results)) {
		for(let handler of Iterator(value)) {
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

var defaultFuncs = {
	fourOhFour: fourOhFour$,
	addParams:  addParams$,
	getUrl:     getUrl$
};

module.exports = jalfrezi(defaultFuncs, function route(options, map) {
	var {
		fourOhFour,
		addParams,
		getUrl
	} = options;

	var trie = compileAll(map);
	var currentTrie = trie;

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

	handle$.add = function(moreRoutes) {
		var newTrie = compileAll(moreRoutes);
		currentTrie = currentTrie.merge(newTrie);
	};

	return handle$;
});

// 1.0 backwards compat
module.exports.with404 = module.exports.withFourOhFour;
module.exports.withParamHandler = module.exports.withAddParams;