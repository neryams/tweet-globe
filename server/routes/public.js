'use strict';

module.exports = function(app) {
	var development = process.env.NODE_ENV !== 'production',
			rootDir;

	if(development) {
		rootDir = '/';
	}
	else {
		rootDir = '/dist/';
	}

	app.get('/', function(req, res) { 
		console.log(__dirname);
		res.sendFile(global.appRoot + rootDir + 'index.html'); 
	});

	app.get(/^\/(.+)$/, function(req, res) { 
		res.sendFile(global.appRoot + rootDir + req.params[0]); 
	});
};