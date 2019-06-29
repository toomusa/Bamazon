var customer = require("./customer.js");
var manager = require("./manager.js");
var mysql = require("mysql");
var fs = require("fs");
var inquirer = require("inquirer");
var keys = require("./keys.js");
const cTable = require("console.table");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: keys.password,
    database: "bamazon_db"
});

const connectDB = () => {
    connection.connect(function(err) {
    if (err) throw err;
    console.log("Connection ID is " + connection.threadId);
    console.log("Supervisor Portal");
    connection.end();
    });
}





module.exports = {
    connectDB
}