
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

let itemOptions = [];
let departmentOptions = [];
let departments = [];
let items = {};
let productPick;
let itemsInCart = {}; // reset this after purchase

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connection ID is " + connection.threadId);
    seeItems();
    // connection.end();
});

const seeItems = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
                    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
                    concat(stock_quantity, ' units') AS "In Stock" FROM products`, async (err, data) => {
        if (err) throw err;
        console.table("\x1b[37m", data);
        createList(data);
        await buyProduct();
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

const findProduct = (res) => {
    for (let key in items) {
        if (items[key] === res.itemBuy) {
            productPick = key;
        }
    }
}

const askRetry = () => {
    console.log("Sorry, we don't have that many in stock.");
    inquirer.prompt([{
        type: "confirm",
        name: "retry",
        message: "Would you like to try again?"
    }]).then(function(res){
        if (res.retry) {
            return buyProduct();
        } else {
            console.log("Thanks, come again!");
            return;
        }
    })
};



const buyProduct = () => {
    new Promise ((resolve, reject) => {
        inquirer.prompt([
            {
                type: "list",
                name: "itemBuy",
                message: "What would you like to purchase today?",
                choices: [...itemOptions]
            },
            {
                type: "number",
                name: "quantityBuy",
                message: "How many would you like?"
            },
            {
                type: "confirm",
                name: "buyMore",
                message: "Would you like to add anything else?",
                default: false
            },
        ]).then((res) => {
            processOrder(res);
        })
        resolve();
    })
}

const processOrder = async (res) => {
    if (res.buyMore) {
        itemsInCart[res.quantityBuy] = res.itemBuy;
        buyProduct();    
    } else {
        itemsInCart[res.quantityBuy] = res.itemBuy;
        findProduct(res);
        connection.query(`SELECT product_name, department_name, price, stock_quantity 
                            FROM products WHERE item_id = ?`, [productPick], (err, data) => {
            if (err) throw err;
            console.log("YOUR CART");
            console.table("\x1b[37m", data);
            if (res.quantityBuy > data[0].stock_quantity) {
                askRetry();
            } else {
                console.log("Program Buy Product");
                console.log(itemsInCart);
                connection.end();
            }
        })
    }
};

       














// The app should then prompt users with two messages.

// The first should ask them the ID of the product they would like to buy.
// The second message should ask how many units of the product they would like to buy.



// Once the customer has placed the order, your application should check if your store has enough of the product to meet the customer's request.

// If not, the app should log a phrase like Insufficient quantity!, and then prevent the order from going through.



// However, if your store does have enough of the product, you should fulfill the customer's order.

// This means updating the SQL database to reflect the remaining quantity.
// Once the update goes through, show the customer the total cost of their purchase.




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