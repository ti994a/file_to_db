const assert    = require('assert');
const config 	= require('./config');
const csv       = require('csvtojson');
const _         = require('lodash');
const os        = require('os');
/*const pgp	    = require('pg-promise')({
	capSQL: true // capitalize all generated SQL
});*/
const yargs     = require('yargs');

const argv = yargs
    .options({
        f: {
            demand: true,
            alias: 'filename',
            describe: 'File to load into database',
            string:true
        }
    })
    .help()
    .alias('help', 'h')
    .argv;

var buildContext = (inputFileName, config) => {
    'use strict';

    try {
        var jsonConfig = JSON.parse(JSON.stringify(config));
        var context = {
            csvFilePath: inputFileName,
            db: {
                user: jsonConfig.postgres.userName,
                password: jsonConfig.postgres.password,
                host: jsonConfig.postgres.hostName,
                database: jsonConfig.postgres.databaseName,
                port: jsonConfig.postgres.port
            }
        };

        assert(!_.isEmpty(context.csvFilePath), "Input file name is undefined");
        assert(!_.isEmpty(context.db.user), "Database username is undefined");
        assert(!_.isEmpty(context.db.password), "Database password is undefined");
        assert(!_.isEmpty(context.db.host), "Database host name is undefined");
        assert(!_.isEmpty(context.db.database), "Database name is undefined");
        assert(!_.isEmpty(JSON.stringify(context.db.port), "Database port is undefined"));

        // get file column to database column mappings and other info from config file based on file name pattern
        for (var i=0; i<jsonConfig.files_to_db.file_to_db.length; ++i) {
            var fileToDB = jsonConfig.files_to_db.file_to_db[i];
            var fileNamePattern = fileToDB.fileNamePattern;
            assert(!_.isEmpty(fileNamePattern), "File name regex pattern is undefined");
            var regexPattern = new RegExp(fileNamePattern);
            var arrMatches = context.csvFilePath.match(regexPattern);
            
            if (Array.isArray(arrMatches) && arrMatches.length) {
                context.destinationTable = fileToDB.mappings.tableName;
                context.colFieldMappings = fileToDB.mappings.colFieldMapping;
                context.filePageSize = fileToDB.filePageSize;
            } 
        }
        
        assert(!_.isEmpty(context.destinationTable), `Could not find destination table in configuration for input file ${context.csvFilePath}`);
        assert(!_.isEmpty(context.colFieldMappings), `Could not find file column to database field mappings in configuration for input file ${context.csvFilePath}`);
        assert(!_.isEmpty(JSON.stringify(context.filePageSize), "File page size is not specified"));

        // convert file column to database column mappings into "prop" and "name" attributes that are recognized by pg-promise
        var pgpromiseColumnSet = {};
        var key = 'columnSet';
        pgpromiseColumnSet[key] = [];
        
        for (var i=0; i<context.colFieldMappings.length; ++i)
            pgpromiseColumnSet[key].push(
                { "prop": context.colFieldMappings[i].fieldName, "name": context.colFieldMappings[i].colName }
            );
        
        context.pgpromiseColumnSet = pgpromiseColumnSet[key];
        context.result = 'Crap';
        return context;
    
    } catch (error) {
       throw (error);
    }
};

var loadDB = (inputFileName, config) => { 

        'use strict';
    try {
        var context = buildContext(inputFileName, config);
        //const db = pgp(context.db);
        //const cs = new pgp.helpers.ColumnSet(context.pgpromiseColumnSet, {table: 'staging'});
        var jsonArray = {};
        jsonArray['rows'] = [];
        var i = 0;
        var recordsProcessed = 0;

       csv()
            .fromFile(context.csvFilePath)
            .on('json', (jsonObj) => {
                jsonArray['rows'].push(jsonObj);
                i += 1;
                if (i === context.filePageSize) {
                    //var query = pgp.helpers.insert(jsonArray['rows'], cs);
                    //db.none(query);
                    jsonArray['rows'] = [];
                    recordsProcessed += i;
                    i = 0;
                }
            })
            .on('done', (err) => {
                if (err) {
                    context.result = `ERROR${os.EOL}${err}`;
                    //throw (context.result);
                }
                else {
                    if (i > 0) {
                        // process remaining data
                        //var query = pgp.helpers.insert(jsonArray['rows'], cs);
                        //db.none(query);
                        recordsProcessed += i;
                    }
                    context.result = `${recordsProcessed} rows read and inserted into database`;
                }
            })
            .on('error', (err) => {
                context.result = `ERROR${os.EOL}${err}`;
                //throw (context.result);
            });  
        
        return context;
    } catch(error) {
        throw (error);
    }
};

var main = () => {
    'use strict';
    
    try {
        var context = loadDB(argv.filename.replace(/\'/g, ''), config);
        //console.log(JSON.stringify(context, undefined, 4));
        console.log(context.result);
    } catch(error) {
        console.log(error);
    }
};

main();
