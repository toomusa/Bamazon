
var mysql = require("mysql");
var fs = require("fs");
var inquirer = require("inquirer");
var keys = require("./keys.js");
const cTable = require('console.table');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: keys.password,
    database: "bamazon_db"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connection ID is " + connection.threadId);
    seeItems();
    connection.end();
});

const seeItems = () => {
    connection.query("SELECT * FROM products", function (err, data){
        if (err) throw err;
        console.table(data);
        console.log(data);
        const itemOptions = [];
        let departments = [];
        let departmentOptions = [];
        for (let key in data) {
            itemOptions.push(`Item ${data[key].item_id}: ${data[key].product_name} | Price: $${data[key].price.toFixed(2)}`);
            departments.push(data[key].department_name);
            departmentOptions = Array.from(new Set(departments));
        }
        console.log(itemOptions);
        console.log(departmentOptions);
    })
}

const addNewProduct = () => {
    inquierer.prompt([
        {
            type: "list",
            name: "department",
            message: "Which department does the new product belong to?",
            choices: [...departmentOptions]
        },
        {
            type: "input",
            name: "item",
            message: "Enter the name of the item:"
        },
        {
            type: "number",
            name: "price",
            message: "How much does it cost? (enter dollar and cents)"
        },
        {
            type: "number",
            name: "quantity",
            message: "How many are we adding to the inventory?"
        }
    ]).then(function (err, res) {
        if (err) throw err;
        console.log(res);
    });
};


const addToInventory = () => {
    inquirer.prompt([
        {
            type: "list",
            name: "selection",
            message: "Which items would you like to replanish?",
            choices: [...itemOptions]
        },
        {
            type: "number",
            name: "added",
            message: "How many are we adding to the inventory?"
        }
    ]).then(function(err, res){
        if (err) throw err;
        console.log(`Item: ${res.selection}, Added: ${res.added}, New Inventory Total: `);
    })
};