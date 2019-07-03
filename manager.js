
var inquirer = require("inquirer");
var keys = require("./keys.js");
var mysql = require("mysql");
const cTable = require("console.table");

let mainData;
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

// "Behind the Scenes" Functions

const connectDB = () => {
    connection.connect(function(err) {
    if (err) throw err;
    console.log("\nMANAGER PORTAL\n");
    queryDB();
    managerPortal();
    });
}

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

// Main Functions

const managerPortal = () => {
    inquirer.prompt([
        {
            type: "list",
            name: "managerAction",
            message: "What would you like to do?",
            choices: ["View Products", "View Low Inventory", "Add to Inventory", "Add a New Product", "Exit Manager Portal"]
        }
    ]).then((res) => {
        switch (res.managerAction) {
            case "View Products": viewProducts(); break; 
            case "View Low Inventory": viewLowInventory(); break; 
            case "Add to Inventory": addToInventory(); break; 
            case "Add a New Product": addNewProduct(); break; 
            case "Exit Manager Portal":
                console.log("\nThanks for checking in\n");
                connection.end();
                break;
        }
    }).catch(err => console.error(err))
};

const viewProducts = () => {
    console.table("\x1b[37m\nPRODUCTS", mainData);
    managerPortal();
};

const viewLowInventory = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
    concat(stock_quantity, ' units') AS "In Stock" FROM products WHERE stock_quantity <= ?`, 
    [10], (err, data) => {
    if (err) throw err;
    (Object.entries(data).length !== 0) ? console.table("\x1b[37m\nLOW INVENTORY", data) : 
                                        console.log("\nThere are no items with less than 5 quantity in stock\n");
    managerPortal();
    })
};

const addToInventory = () => {
    inquirer.prompt([
        {
            type: "list",
            name: "selection",
            message: "Which items would you like to replenish?",
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
        connection.query(`UPDATE products SET stock_quantity = ? WHERE item_id = ?`, 
            [newStock, itemNumber], async (err, data) => {
            if (err) throw err;
            await queryDB();
            const updatedItem = mainData.filter(item => {
                return parseInt(item["Item #"]) === parseInt(itemNumber)
            })
            console.log(`\nItem: ${response.selection}, Added: ${response.added}`);
            console.log(`\nNew Inventory Total: ${updatedItem[0]["In Stock"]}\n`)
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
        let query = `INSERT INTO products (product_name, department_name, price, stock_quantity)
                    VALUES ("${res.item}", "${res.department}", ${res.price}, ${res.quantity})`
            connection.query(query, (err, data) => {
                if (err) throw (err);
                connection.query(`SELECT * FROM products WHERE product_name = "${res.item}"`, (err, data) => {
                    if (err) throw (err);
                    console.table("\nNEW PRODUCT", data)
                    managerPortal()
                })
            })
    }).catch((err) => console.error(err));
};

module.exports = {
    connectDB
}