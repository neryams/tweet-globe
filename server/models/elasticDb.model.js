'use strict';

var config = require('../config'),
		elasticsearch = require('elasticsearch'),
		_ = require('lodash');

var mappingParams = { 
	index: config.elasticIndex,
	body: {
    properties: {
    	user_id:  { type: 'string', index: 'not_analyzed' },
      created:  { type: 'date' },
      location: { type: 'geo_point' },
      message:  { type: 'string' }
    }
	}
};

var TwitterElastic = function TwitterElastic() {
	this.client = new elasticsearch.Client({
	  host: 'localhost:9200',
	  log: 'trace'
	});

	this.client.indices.exists({index: config.elasticIndex}).then(function(exists) {
		console.log('index exists?', exists);
		if(!exists) {
			return this.client.indices.create({ index: config.elasticIndex });
		}
	});
};

TwitterElastic.prototype.createMap = function createMap(track) { 
	var mappingParamsTrack = _.assign({ type: track }, mappingParams);
	console.log(mappingParamsTrack);

	return this.client.indices.getMapping({ index: config.elasticIndex, type: track }).then(function(result) {
		console.log('mapping result:', JSON.stringify(result));
		if(_.isEmpty(result)) {
			return this.client.indices.putMapping(mappingParamsTrack).then(function() {
				console.log('Added mapping to elasticsearch: ', JSON.stringify(mappingParamsTrack));
			});
		} else {
			return result;
		}
	});
};

TwitterElastic.prototype.addTweet = function addTweet(tweetId, track, data) { 
	this.client.create({
	  index: config.elasticIndex,
	  type: track,
	  id: tweetId,
	  body: data
	}).then(function(response) {
		return response;
	}, function (error) {
	  console.error('Could not save to elasticsearch: ', error);
	});
};

module.exports = TwitterElastic;