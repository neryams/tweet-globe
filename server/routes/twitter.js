'use strict';

var twitterApi = require('../models/twitterApi.model');

module.exports = function(app) {
	app.get('/oauth/:track', function(req, res) {
		twitterApi.search(req.params.track).then(function(tweets) {
			res.send(tweets);
		});
	});
};