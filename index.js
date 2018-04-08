'use strict';
const config 	= require('./config')
const AWS 		= require("aws-sdk");

// ---- Read file from s3 buck and save to local file
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var params = {Bucket: config.s3.sourceBucket, Key: config.s3.sourceFileKey };
console.log(__dirname + "/" + params.Key);
// Create file Stream
const outputFile = require('fs').createWriteStream(__dirname + "/" + params.Key);
// s3.getObject(params).createReadStream().pipe(outputFile);

// ---- Load file into Staging table in our Postgres DB
const csvHeaders 	= require('csv-headers');
const pg			= require('pg');

new Promise((resolve, reject) => {
    // Read the first line of the CSV. The script relies on there being a header line in the CSV naming each column.
	csvHeaders({
        file      : outputFile,
        delimiter : ','
    }, function(err, headers) {
        if (err) reject(err);
        else resolve({ headers });
    });
})
.then(context => {
    const dbconfig = {
    user: config.postgres.userName,
    password: config.postgres.password,
	host: config.postgres.hostName,
	database: config.postgres.databaseName,
    port: config.postgres.port
	};
	const pool = new pg.Pool(dbconfig);
	
	return new Promise((resolve, reject) => {
		pool.connect(function(err, client, done) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                reject(err);
            } else {
                context.db = client;
				console.log('Connected');
				resolve(context);
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
				console.log(result.rows);
			}
		});
	})
})
.then(context => { context.db.end(); })
.catch(err => { console.error(err.stack); });



