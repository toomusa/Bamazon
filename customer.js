
var mysql = require("mysql");
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

let itemOptions = [];
let departmentOptions = [];
let departments = [];
let items = {};
let productPick;
let itemsInCart = {}; 
let productSearch = [];
let createObj = {};
let purchaseHistory = {};
let mainData;

// Support Functions

const connectDB = () => {
    connection.connect(function(err) {
    if (err) throw err;
    console.log("\nCUSTOMER PORTAL\n");
    seeItems();
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

const findProduct = (res) => {
    for (let key in items) {
        if (items[key] === res.itemBuy) {
            productPick = key;
        }
    }
}

const queryVariables = (res) => {
    let itemNumber = res.itemBuy.slice(5, 7).replace(":", " ").trim();
    (itemsInCart[itemNumber]) ? itemsInCart[itemNumber] += res.quantityBuy : itemsInCart[itemNumber] = res.quantityBuy;
    findProduct(res);
    createObj.item_id = parseInt(productPick);
    productSearch.push(createObj);
    createObj = {};
}

const askRetry = () => {
    console.log("\nSorry, we don't have that many in stock\n");
    inquirer.prompt([{
        type: "confirm",
        name: "retry",
        message: "Would you like to try again?"
    }]).then(function(res){
        if (res.retry) {
            return buyProduct();
        } else {
            console.log("\nThanks, come again!\n");
            return connection.end();
        }
    })
};

// Main Functions

const seeItems = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
                    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
                    concat(stock_quantity, ' units') AS "In Stock" FROM products`, async (err, data) => {
        if (err) throw err;
        console.table("\x1b[37m\nITEMS IN STOCK", data);
        mainData = data;
        createList(data);
        await buyProduct();
    })
}

const buyProduct = () => {
    return inquirer.prompt([
        {
            type: "list",
            name: "itemBuy",
            message: "What would you like to purchase today?",
            choices: [...itemOptions]
        },
        {
            type: "number",
            name: "quantityBuy",
            message: "How many would you like?",
            validate: function(answer){
                const valid = !isNaN(answer);
                return valid;
            },
        },
        {
            type: "confirm",
            name: "buyMore",
            message: "Would you like to add anything else?",
            default: false
        },
    ])
    .then((res) => {processOrder(res)})
    .catch((error) => {console.error(error)})
}

const processOrder = async (res) => {
    let goodOrder = false;
    mainData.forEach(item => {
        itemNumber = parseInt(res.itemBuy.slice(5, 7).replace(":", " ").trim());
        currentStock = parseInt(item["In Stock"].slice(0, -6).trim());
        if (item["Item #"] === itemNumber && res.quantityBuy < currentStock) {goodOrder = true}
    });
    if (!goodOrder) {
        return askRetry();
    } else if (res.buyMore) {
        queryVariables(res);
        buyProduct();    
        } else {
        queryVariables(res);
        let questionMark = "?";
        for (let i = 0; i < productSearch.length - 1; i++) {questionMark += " OR ?"}
        var query = `SELECT item_id AS "Item #", product_name AS "Product", department_name AS "Department", 
                    concat('$', format(price, 2)) AS "Price", concat(stock_quantity, ' units') AS "In Stock"
                    FROM products WHERE ${questionMark}`;
        connection.query(query, [...productSearch], async (err, data) => {
            if (err) throw err;
            const newData = await data.map(item => {
                item['Quantity'] = itemsInCart[item['Item #']];
                return item;
            })
            console.table("\x1b[37m\nYOUR CART", newData); 
            inquirer.prompt([
                {
                    type: "confirm",
                    name: "shopMore", 
                    message: "Would you like to finalize your purchase?",
                    default: true
                },
            ]).then((response) => {(response.shopMore) ? completePurchase(newData) : buyProduct();
            }).catch((error) => {console.error(error)})
        })
    }
}


function updateItemInDatabase(itemObj) {
    return new Promise((resolve, reject) => {
        let updateItemString = (stock, sales, quantity, id) => 
            `UPDATE products SET stock_quantity = ${stock}, product_sales = ${sales}, sold_quantity = ${quantity} WHERE item_id = ${id};`;
        let query = updateItemString(itemObj.newStock, itemObj.totalSales, itemObj.quantity, itemObj.id)
        connection.query(query, (err, data) => {
            if(err) return reject();
            return resolve(data);
        })
    })
}

const completePurchase = async (newData) => {
    let totalCost = 0;
    const itemData = newData.map(item => {
        let newStock, totalSales;
        newStock = parseInt(item["In Stock"].slice(0, -6).trim()) - item["Quantity"]
        totalSales = parseInt(item["Price"].replace("$", " ").trim()) * item["Quantity"]
        totalCost += totalSales
        return { id: item["Item #"], newStock, totalSales, quantity: item["Quantity"] }
    })
    await Promise.all(itemData.map(item => updateItemInDatabase(item))).catch((error) => {throw error});
    console.log("\nCongratulations on your purchase!")
    console.log("\nYour total cost is $" + totalCost.toFixed(2) + "\n")
    resetVars();
    inquirer.prompt([ 
        {
            type: "confirm",
            name: "shopAgain",
            message: "Would you like to shop again?",
            default: false
        },
    ]).then((res) => {
        if (res.shopAgain) {
            seeItems();
        } else {
            console.log("\nThanks, come again!\n"); 
            connection.end()
        }
    }).catch((error) => {console.error(error)})
}

const resetVars = () => {
    itemOptions = [];
    departmentOptions = [];
    departments = [];
    items = {};
    productPick;
    itemsInCart = {}; 
    productSearch = [];
    createObj = {};
    mainData = {};
    newData = {};
    totalCost = 0;
}

module.exports = {
    connectDB
}