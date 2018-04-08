module.exports = {
	s3:{
		sourceBucket:"file-to-db-bucket",
		sourceFileKey:"TimeReport.csv"
	},
	postgres:{
		userName:"postgres",
		password:"postgres",
		hostName:"localhost",
		databaseName:"file_to_db",
		port:5432
	},
	files_to_db:{
		file_to_db:[
			{
				fileTypeDescription: "Test timesheet file",
				fileNamePattern: ".*",
				fileNamePatternOld:"\w+.csv.original",
				filePageSize: 10,
				mappings:{
					tableName: "staging",
					colFieldMapping:[
						{colName:"project_hierarchy", fieldName:"project_hierarchy"},
						{colName:"project", fieldName:"project"},
						{colName:"project_group", fieldName:"project_group"},
						{colName:"worker_name", fieldName:"worker_name"},
						{colName:"worker_id", fieldName:"worker_id"}
					]
				}
			},
			{
				fileTypeDescription: "???????",
				fileNamePattern:"y",
				mappings:{
					tableName: "staging2",
					colFieldMapping:[
						{colName:"1"},
						{colName:"3"},
						{colName:"4"},
						{colName:"6"}
					]
				}
			},
			{
				fileTypeDescription: "????",
				fileNamePattern:"z",
				mappings:{
					tableName: "staging3",
					colFieldMapping:[
						{colName:"1"},
						{colName:"3"},
						{colName:"4"},
						{colName:"6"}
					]
				}
			},
		]
	}
};