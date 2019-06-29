
var inquirer = require("inquirer");
var keys = require("./keys.js");
var mysql = require("mysql");

var fs = require("fs");
var customer = require("./customer.js");
var supervisor = require("./supervisor.js");
const cTable = require("console.table");

let mainData;
let lowInventory;

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
    console.log("Manager Portal");
    await managerPortal();
    connection.end();
    });
}



// List a set of menu options:
// View Products for Sale
// View Low Inventory
// Add to Inventory
// Add New Product


// If a manager selects View Products for Sale, the app should list every 
// available item: the item IDs, names, prices, and quantities.

// If a manager selects View Low Inventory, then it should list all items 
// with an inventory count lower than five.

// If a manager selects Add to Inventory, your app should display a prompt 
// that will let the manager "add more" of any item currently in the store.

// If a manager selects Add New Product, it should allow the manager to 
// add a completely new product to the store.

const managerPortal = () => {
    inquirer.prompt([
        {
            type: "List",
            name: "managerAction",
            message: "What would you like to do?",
            choices: ["View Products", "View Low Inventory", "Add to Inventory", "Add a New Product"]
        }
    ]).then((res) => {
        switch (res.managerAction) {
            case "View Products": viewProducts(); break;
            case "View Low Inventory": viewLowInventory(); break;
            case "Add to Inventory": addToInventory(); break;
            case "Add a New Product": addNewProduct(); break;
            case "That's all for now":
                console.log("Thanks for checking in");
                connection.end();
                break;
        }
    }).catch(err => console.error(err))
};



const viewProducts = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
    concat(stock_quantity, ' units') AS "In Stock" FROM products`, async (err, data) => {
    if (err) throw err;
    console.table("\x1b[37m", data);
    mainData = data;
    connection.end();
    })
};

const viewLowInventory = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
    concat(stock_quantity, ' units') AS "In Stock" FROM products WHERE ?`, 
    [stock_quantity <= 5], async (err, data) => {
    if (err) throw err;
    console.table("\x1b[37m", data);
    lowInventory = data;

    // ADD OPTION TO RUN addToInventory

    })
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


module.exports = {
    connectDB,
    viewProducts,
    viewLowInventory,
    addNewProduct,
    addToInventory
}