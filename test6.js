'use strict';
const config 	= require('./config')
const AWS 	= require("aws-sdk");

// ---- Read file from s3 buck and save to local file
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var params = {Bucket: config.s3.sourceBucket, Key: config.s3.sourceFileKey };
console.log(__dirname + "/" + params.Key);
// Create file Stream
const outputFile = require('fs').createWriteStream(__dirname + "/" + params.Key);
// s3.getObject(params).createReadStream().pipe(outputFile);

// ---- Load file into Staging table in our Postgres DB
const csvHeaders 	= require('csv-headers');
const pg		= require('pg');


const dbconfig = {
	user: config.postgres.userName,
	password: config.postgres.password,
	host: config.postgres.hostName,
	database: config.postgres.databaseName,
	port: config.postgres.port
};
const pool = new pg.Pool(dbconfig);

/*var files_to_db = config.files_to_db;

console.log(files_to_db);*/

//var arr = JSON.parse(files_to_db);

/*for(var item in files_to_db){
	console.log(files_to_db[item][0]);
	console.log(files_to_db[item][1]);
	console.log(files_to_db[item][2]);
}*/

/*for (var i = 0; i < files_to_db.length; i++) {
	for (var j = 0; j < arr[i].length; j++) {
		for (var k = 0; k < arr[i][j].length; k++) {
    		console.log(arr[i][j][k]);
  		}
	}
}*/
new Promise((resolve, reject) => {
	csvHeaders({
		file      : config.sourceFileKey,
		delimiter : ','
	}, function(err, headers) {
		if (err) reject(err);
		else resolve({ headers });
	});
})
.then(context=> {
	return new Promise((resolve, reject) => {
		pool.connect(function(err, client, done) {
			if (err) {
				console.error('error connecting: ' + err.stack);
				reject(err);
			} else {
				context.db = client;
				resolve(context);
				//console.log('Connected');
			}

   		});

	})
})
.then(context => {
		return new Promise((resolve, reject) => {
		context.db.query('SELECT NOW() as now', function(err, result) {
			if (err) {
				console.error('error running query: ' + err.stack);
				reject(err);
			} else {			
				context.result = result.rows;
				//console.log(context.result);
				resolve(context);
			}
		});
	})
})
.then(context => { context.db.end(); })
//.then(context => { console.out(context.result); });
.catch(err => { console.error(err.stack); });




