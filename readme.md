<h1 align="center">
	<img src="https://raw.githubusercontent.com/quarterto/Boulevard/master/logo.png" width="400" alt="Boulevard"><br>

	<a href="http://badge.fury.io/js/boulevard">
		<img src="https://badge.fury.io/js/boulevard.svg" alt="npm version">
	</a>
	<a href="https://travis-ci.org/quarterto/Boulevard">
		<img src="https://travis-ci.org/quarterto/Boulevard.svg" alt="Build status">
	</a>
</h1>

Handler-agnostic URL router.

```
npm install boulevard
```

Usage
-----

Takes a map of URLs (maybe with parameters) to functions and returns a function:

```javascript
var route = require('boulevard');

route({
	'/': homeHandler,
	'/foo/:bar': barHandler
})
```

### Handler arguments

Arguments are passed down from the returned function to the handler functions. This way, any shape of handler function can be used; the only requirement is that the `request` (or an object containing `url`) is the first argument. For example, you can use it directly with `http.createServer`:

```javascript
http.createServer(route({
	'/': function(req, res) {
		res.end('home!');
	}
}));
```

### Parameters

Parameters are, by default, passed as the last argument to the handler:

```javascript
route({
	'/foo/:bar': function(req, res, params) {
		console.log('foo: ' + params.bar);
	}
});
```

### Multiple matches

If there are multiple matching handlers, concrete matches are called before parameterised routes, and the first handler that doesn't return `false` wins:

```javascript
route({
	'/foo/:bar': function(req, res, params) {
		console.log('foo: ' + params.bar);
	},
	'/foo/baz': function(req, res) {
		console.log('foobaz');
	}
});
```

### Return values

Values returned from route handlers control what Boulevard does next. If you return `false`, control passes to the next matched handler (if any) or the 404 handler. If you return a non-`false` value or `undefined`, it considers your handling finished, and doesn't call any more handlers. The value is returned by the router.

### Routes with the same path

If you need separate handlers at the same path (for example, a `GET` handler and a `POST` handler), you can pass in an array of maps or pairs instead of the the route map:

```javascript
route([
	['/', function(req) {
		if(req.method === 'GET') {
			// ...
		} else return false;
	}],
	['/', function(req) {
		if(req.method === 'POST') {
			// ...
		} else return false;
	}],
	{'/': function(req) {
		if(req.method === 'PUT') {
			// ...
		} else return false;
	}}
])
```

### 404

If no routes match, a 404 handler is called. The default handler works with `http.createServer`; it sets the `statusCode` to `404` and sends an empty response.

### Combining routers
#### `concat`
Returns a new router combining the routes.

```javascript
var a = route({
	'/foo': function() {
		return 'foo';
	}
});

var b = route({
	'/bar': function() {
		return 'bar';
	}
});

var c = a.concat(b);
c({url: '/bar'}) //⇒ 'bar'
a({url: '/bar'}) //⇒ 404
```

#### `use`
Return a new router with the routes of the given router available as a subpath.

```javascript
var a = route({
	'/foo': function() {
		return 'foo';
	}
});

var b = route({
	'/bar': function() {
		return 'bar';
	}
});

var c = a.use('quux', b);
c({url: '/quux/bar'}) //⇒ 'bar'
c({url: '/bar'}) //⇒ 404
```

#### Adding routes post-facto

The router function returned by Boulevard has an `add` method, which merges in a new map of routes:

```javascript
var routes = route({
	'/': function() {
		return 'foo';
	}
});

routes({url: '/'}) //⇒ 'foo'
routes({url: '/bar'}) //⇒ 404

routes.add({
	'/bar': function() {
		return 'baz';
	}
});

routes({url: '/'}) //⇒ 'foo'
routes({url: '/bar'}) //⇒ 'baz'
```



### Overriding default behaviour

As well as the default router, `boulevard` exports functions that allow you to override various parts of default behaviour. They each take functions to override and return a version of the router with the new behaviour.

#### Custom 404 handler (`withFourOhFour`)
###### Alias `with404`
Takes a handler of the same shape as your regular route handlers, which is called when none of the URLs match:

```javascript
var myRoute = route.withFourOhFour(function(req, res) {
	res.statusCode = 404;
	res.end('Not found: ' + req.url);
});
```

#### Custom parameter munging (`withAddParams`)
###### Alias `withParamHandler`
Takes a function with arguments `params` (the parameters extracted from the URL) and `args` (the arguments passed to the original handler). Should return an array of arguments to pass to the matched handler.

```javascript
var myRoute = route.withAddParams(function(params, args) {
	args[0].params = params;
	return args;
});
```

#### Custom URL gleaning (`withGetUrl`)
Gets passed the arguments from the router, should return the URL to match against. By default, parses the url to strip off any query string.

```javascript
var myRoute = route.withGetUrl(function(req) {
	return req.url;
});
```

#### `route_`

`route_` takes a hash of the above customisable functions as its first argument. Any not passed in is set to [the default](https://github.com/quarterto/Boulevard/blob/880aa2b5e3b60ba2227e764d4750b549e042f60c/src/index.js#L89-L106).

Licence
---
MIT.
