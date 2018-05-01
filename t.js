const route = require('./');

const router = route({
	'/' () {
		return 5;
	},

	'/foo' () {
		return Promise.resolve(12);
	},

	'/foo/:id' (req, params) {
		return params;
	}
});

Promise.resolve(router({url: process.argv[2]})).then(console.log, e => console.error(e.stack));