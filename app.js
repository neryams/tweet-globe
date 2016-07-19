/* jshint node: true */
'use strict';

var chalk = require('chalk'),
		app = require('express')(),
		fs = require("fs"),
		core = require('./server/core');

global.appRoot = __dirname;

var server = app.listen(5000, function() {
  console.log(
    chalk.green.bold('Server is running on port ' + server.address().port),
    chalk.gray('\nCtrl+C to shut down')
  );
});

core.init(server);

fs.readdirSync('./server/routes').forEach(function(file) {
	if(file !== 'public.js') {
  	require("./server/routes/" + file)(app);
	}
});
require("./server/routes/public")(app);