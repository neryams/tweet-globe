'use strict';

var elasticDb = require('../models/elasticDb.model');

module.exports = function(app) {
	app.get('/query/:type', function(req, res) {
		elasticDb.pullFromLocal(req.params.type).then(function(tweets) {
			res.send(tweets);
		});
	});

	app.get('/query/:type/:track', function(req, res) {
		elasticDb.pullFromLocal(req.params.type, req.params.track).then(function(tweets) {
			res.send(tweets);
		});
	});
};