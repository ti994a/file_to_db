'use strict';

const assert    = require('assert');
const config 	= require('./config');
const csv       = require('csvtojson');
const _         = require('lodash');
const pgp	    = require('pg-promise')({
	capSQL: true // capitalize all generated SQL
});
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

function isEmptyObject(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
        }
    }
    return true;
    }

var buildContext = (inputFileName, config) => {
    
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

        // get file column to database column mappings from config file based on file name pattern
        for (var i=0; i<jsonConfig.files_to_db.file_to_db.length; ++i) {
            var fileToDB = jsonConfig.files_to_db.file_to_db[i];
            var fileNamePattern = fileToDB.fileNamePattern;
            assert(!_.isEmpty(fileNamePattern), "File name regex pattern is undefined");
            var regexPattern = new RegExp(fileNamePattern);
            var arrMatches = context.csvFilePath.match(regexPattern);
            
            if (Array.isArray(arrMatches) && arrMatches.length) {
                context.destinationTable = fileToDB.mappings.tableName;
                context.colFieldMappings = fileToDB.mappings.colFieldMapping;
            } 
        }
        
        assert(!_.isEmpty(context.destinationTable), `Could not find destination table in configuration for input file ${context.csvFilePath}`);
        assert(!_.isEmpty(context.colFieldMappings), `Could not find file column to database field mappings in configuration for input file ${context.csvFilePath}`);

        // convert file column to database column mappings into "prop" and "name" attributes that are recognized by pg-promise
        var pgpromiseColumnSet = {};
        var key = 'columnSet';
        pgpromiseColumnSet[key] = [];
        
        for (var i=0; i<context.colFieldMappings.length; ++i)
            pgpromiseColumnSet[key].push(
                { "prop": context.colFieldMappings[i].fieldName, "name": context.colFieldMappings[i].colName }
            );
        
        context.pgpromiseColumnSet = pgpromiseColumnSet[key];

        return context;
    
    } catch (err) {
        console.log(err);
       // throw (err);
    }
}

var main = (inputFileName, config) => { 
    var context = buildContext(inputFileName, config);
    
    return new Promise((resolve, reject) => {
        var jsonFile;
        csv()
            .fromFile(context.csvFilePath)
            // .on('json', (jsonObj) => {
            //     jsonFileString += JSON.stringify(jsonObj);
            // })
            .on('end_parsed', (jsonArrObj) => {
                jsonFile = jsonArrObj;
            })
            .on('done', (error) => {
                if (error) 
                    reject(error);
                else
                    // loop through jsonFile, 
                    resolve(jsonFile);
            });
    }).then(
        (results) => {
            context.jsonFile = results;
            const db = pgp(context.db);
            var cs = new pgp.helpers.ColumnSet(context.pgpromiseColumnSet, {table: 'staging'});
            var values = context.jsonFile;
            var query = pgp.helpers.insert(values, cs);
            db.none(query)
        }).then(
            (results) => {
                context.result = 'Database inserts successful';
            }).catch(
                (errorMessage) => {
                    context.result = errorMessage;
                });
    console.log (context);
}

main(argv.filename.replace(/\'/g, ''), config);