//using pg-promise library for high performance bulk updates
'use strict';
const config 	= require('./config')
const promise 	= require('bluebird'); // or any other Promise/A+ compatible library;
const pgp	= require('pg-promise')({
	capSQL: true, // capitalize all generated SQL
	promiseLib: promise
});
const dbconfig = {
	user: config.postgres.userName,
	password: config.postgres.password,
	host: config.postgres.hostName,
	database: config.postgres.databaseName,
	port: config.postgres.port
};

const db = pgp(dbconfig);

const cs = new pgp.helpers.ColumnSet(['project_hierarchy', 'project', 'project_group', 'worker_name', 'worker_id'], {table: 'staging'});

const values = 	[	{project_hierarchy: 'a1', project: 'b1', project_group: 'c1', worker_name: 'd1', worker_id: 'e1'},
			{project_hierarchy: 'a1', project: 'b1', project_group: 'c1', worker_name: 'd1', worker_id: 'e1'},
			{project_hierarchy: 'a1', project: 'b1', project_group: 'c1', worker_name: 'd1', worker_id: 'e1'}
		];

const query = pgp.helpers.insert(values, cs);

db.none(query)
    .then(data => {
        console.log('success');
    })
    .catch(error => {
        console.log('error');
	console.log(error);
    });

/*db.any('SELECT NOW() as now', [true])
    .then(data => {
        console.log('DATA:', data); // print data;
    })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    })
    .finally(db.$pool.end); // For immediate app exit, shutting down the connection pool*/
// For details see: https://github.com/vitaly-t/pg-promise#library-de-initialization
