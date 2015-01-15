<h1 align="center"><img src="https://raw.githubusercontent.com/quarterto/Boulevard/master/logo.png" width="400" alt="Boulevard"></h1>

Handler-agnostic URL router.

```
npm instal boulevard
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

Arguments are passed down from the returned function to the handler functions. This way, any shape of handler function can be used; the only requirement is that the `request` (or an object containing `url`) is the first argument. For example, you can use it directly with `http.createServer`:

```javascript
http.createServer(route({
	'/': function(req, res) {
		res.end('home!');
	}
}));
```

Parameters are, by default, passed as the last argument to the handler:

```javascript
route({
	'/foo/:bar': function(req, res, params) {
		console.log('foo: ' + params.bar);
	}
});
```

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

If no routes match, a 404 handler is called. The default handler works with `http.createServer`; it sets the `statusCode` to `404` and sends an empty response.

Adding routes post-facto
---
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

Overriding default behaviour
---
As well as the default router, `boulevard` exports functions that allow you to override various parts of default behaviour. They each take functions to override and return a version of the router with the new behaviour.

### Custom 404 handler (`with404`)
Takes a handler of the same shape as your regular route handlers, which is called when none of the URLs match:

```javascript
var myRoute = route.with404(function(req, res) {
	res.statusCode = 404;
	res.end('Not found: ' + req.url);
});
```

### Custom parameter munging (`withParamHandler`)
Takes a function with arguments `params` (the parameters extracted from the URL) and `args` (the arguments passed to the original handler). Should return an array of arguments to pass to the matched handler.

```javascript
var myRoute = route.withParamHandler(function(params, args) {
	args[0].params = params;
	return args;
});
```

### Both (`route_`)

`route_` takes a parameter handler *and* a 404 handler and returns a router.

Return values
---
Values returned from route handlers control what Boulevard does next. If you return `false` or `None`, control passes to the next matched handler (if any) or the 404 handler. If you return a `Some`, a non-`false` value, or `undefined`, it considers your handling finished, and doesn't call any more handlers. The value or the contents of the `Some` are returned from the router.

Licence
---
MIT.