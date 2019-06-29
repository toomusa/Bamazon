
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

const connectDB = () => {
    connection.connect(function(err) {
    if (err) throw err;
    console.log("Connection ID is " + connection.threadId);
    seeItems();
    });
}

const seeItems = () => {
    connection.query(`SELECT item_id AS "Item #", product_name AS "Product",
                    department_name AS "Department", concat('$', format(price, 2)) AS "Price",
                    concat(stock_quantity, ' units') AS "In Stock" FROM products`, async (err, data) => {
        if (err) throw err;
        console.table("\x1b[37m", data);
        mainData = data;
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
            return connection.end();
        }
    })
};

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

const queryVariables = (res) => {
    let itemNumber = res.itemBuy.slice(5, 7).replace(":", " ").trim();
    (itemsInCart[itemNumber]) ? itemsInCart[itemNumber] += res.quantityBuy : itemsInCart[itemNumber] = res.quantityBuy;
    console.log("CART: " + JSON.stringify(itemsInCart))
    findProduct(res);
    createObj.item_id = parseInt(productPick);
    productSearch.push(createObj);
    createObj = {};
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

        connection.query(query, [...productSearch], (err, data) => {
            if (err) throw err;
            const newData = data.map(item => {
                item['Quantity'] = itemsInCart[ item['Item #'] ];
                return item;
            })
            console.table("\x1b[37m", newData); 
            console.log("The items above are in your cart");
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


const completePurchase = (newData) => {
    let totalCost = 0;
    for (let key in newData) {
        newData[key]["In Stock"] = parseInt(newData[key]["In Stock"].slice(0, -6).trim()) - newData[key]["Quantity"];
        newData[key]["In Stock"] += " units"; 
        totalCost += (parseInt(newData[key]["Quantity"])) * (parseInt(newData[key]["Price"].replace("$", " ").trim()))
    }
    console.log("Congratulations on your purchase!")
    console.log("Your total cost is $" + totalCost.toFixed(2))
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
            console.log("Thanks, come again!"); 
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
    itemOptions,
    departmentOptions,
    departments,
    items,
    productPick,
    itemsInCart,
    productSearch,
    createObj,
    mainData,

    connectDB,
    seeItems,
    createList,
    findProduct,
    askRetry,
    buyProduct,
    queryVariables,
    processOrder,
    completePurchase,
    resetVars
}