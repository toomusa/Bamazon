
var inquirer = require("inquirer");
var keys = require("./keys.js");
var mysql = require("mysql");

var fs = require("fs");
var customer = require("./customer.js");
var supervisor = require("./supervisor.js");
const cTable = require("console.table");

let mainData;
let lowInventory;
let itemOptions = [];
let departmentOptions = [];
let departments = [];
let items = {};
let itemNumber;
let currentStock;

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: keys.password,
    database: "bamazon_db"
});

const queryDB = () => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
        department_name AS "Department", concat('$', format(price, 2)) AS "Price",
        concat(stock_quantity, ' units') AS "In Stock" FROM products`, (err, data) => {
            if (err) reject(err);
            mainData = data;
            createList(data);
            resolve();
        })
    })
}

const connectDB = () => {
    connection.connect(function(err) {
    if (err) throw err;
    console.log("Connection ID is " + connection.threadId);
    console.log("Manager Portal");
    queryDB();
    managerPortal();
    });
}

const createList = (data) => {
    for (let key in data) {
        let itemID = data[key]["Item #"];
        items[itemID] = `Item ${data[key]["Item #"]}: ${data[key]["Product"]} | Price: $${data[key]["Price"]}`;
        departments.push(data[key]["Department"]);
        departmentOptions = Array.from(new Set(departments));
    } 
    itemOptions = Object.values(items);
};

const findProduct = (response) => {
    for (let key in items) {
        if (items[key] === response.selection) {
            itemNumber = key;
        }
    }
    for (let key in mainData) {
        if (mainData[key]["Item #"] === parseInt(itemNumber)) {
            currentStock = parseInt(mainData[key]["In Stock"].slice(0, -6).trim());
        }
    }
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
            type: "list",
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
    console.table("\x1b[37m", mainData);
    managerPortal();
};

const viewLowInventory = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
    concat(stock_quantity, ' units') AS "In Stock" FROM products WHERE stock_quantity <= ?`, 
    [10], (err, data) => {
    if (err) throw err;
    (Object.entries(data).length !== 0) ? console.table("\x1b[37m", data) : console.log("\nThere are no items with less than 5 quantity in stock\n");
    lowInventory = data;
    managerPortal();
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
            message: "How many are you adding to the inventory?",
            validate: function(answer){
                const valid = !isNaN(answer);
                return valid;
            }
        }
    ]).then((response) => {
        findProduct(response)
        let newStock = response.added + currentStock;
        console.log("NEW STOCK: " + newStock)
        console.log("LOW INVENTORY ITEM ID: " + itemNumber) 
        connection.query(`UPDATE products SET stock_quantity = ? WHERE item_id = ?`, 
            [newStock, itemNumber], async (err, data) => {
            if (err) throw err;
            await queryDB();
            console.log(`Item: ${response.selection}, Added: ${response.added}`);
            const updatedItem = mainData.filter(item => {
                console.log(item)
                console.log("Line 163: " + item["Item #"])
                return parseInt(item["Item #"]) === parseInt(itemNumber)
            })
            console.log(`New Inventory Total: ${updatedItem[0]["In Stock"]}`)
            managerPortal();
        });
    }).catch(err => console.error(err))
}


const addNewProduct = () => {
    inquirer.prompt([
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
            message: "How much does it cost?",
            validate: function(answer){
                const valid = !isNaN(answer);
                return valid;
            }
        },
        {
            type: "number",
            name: "quantity",
            message: "How many are we adding to the inventory?",
            validate: function(answer){
                const valid = !isNaN(answer);
                return valid;
            }
        }
    ]).then(function (res) {
        console.log(res);
        let query = `INSERT INTO products (product_name, department_name, price, stock_quantity)
                    VALUES ("${res.item}", "${res.department}", ${res.price}, ${res.quantity})`
        console.log(query)
        connection.query(query, (err, data) => {
            if (err) throw err;
            console.log(data.affectedRows)
            connection.query(`SELECT * FROM products WHERE product_name = "${res.item}"`, (err, data) => {
                if (err) throw err;
                console.table(data)
            })
        managerPortal();
        })
    }).catch((err) => console.error(err));
};


module.exports = {
    connectDB,
    viewProducts,
    viewLowInventory,
    addNewProduct,
    addToInventory
}