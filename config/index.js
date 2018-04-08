// Return merged JSON object of both default.js and <current_environment>.js.
// If NODE_ENV environment variable is undefined, development is assumed as default environment.
const _ = require("lodash");
const defaults = require("./default.js");
const config = require("./" + (process.env.NODE_ENV || "development") + ".js");
module.exports = _.merge({}, defaults, config);
