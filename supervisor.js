
var mysql = require("mysql");
var inquirer = require("inquirer");
var keys = require("./keys.js");

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
    console.log("\nSUPERVISOR PORTAL\n");
    supervisorPortal();
    });
}

const queryDB = () => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT department_id AS "Department ID", department_name AS "Departments", 
        over_head_costs AS "Overhead Costs" FROM departments`, (err, data) => {
            if (err) reject(err);
            console.table("\nDEPARTMENTS", data);
            resolve();
        })
    })
}

const supervisorPortal = () => {
    inquirer.prompt([
        {
            type: "list",
            name: "supervisorAction",
            message: "What would you like to do?",
            choices: ["View Product Sales by Department", "Create New Department", "Exit Supervisor Portal"]
        }
    ]).then((res) => {
        switch (res.supervisorAction) {
            case "View Product Sales by Department": viewProductSales(); break; 
            case "Create New Department": createNewDepartment(); break; 
            case "Exit Supervisor Portal":
                console.log("\nThanks for checking in\n");
                connection.end();
                break;
        }
    }).catch(err => console.error(err))
};

const viewProductSales = () => {
    return new Promise((resolve, reject) => {
        let query = `SELECT departments.department_id AS "Department ID", departments.department_name AS "Departments", 
        departments.over_head_costs AS "Overhead Costs", SUM(products.product_sales) AS "Product Sales", 
        (SUM(products.product_sales) - departments.over_head_costs) AS "Total Profit" 
        FROM products INNER JOIN departments ON departments.department_name = products.department_name 
        GROUP BY products.department_name`;
        connection.query(query, (err, res) => {
            if (err) reject(err);
            console.table("\nPRODUCT SALES BY DEPARTMENT", res);
            supervisorPortal();
            resolve();
        }) 
    })
}

const createNewDepartment = () => {
    inquirer.prompt([
        {
            type: "input",
            name: "department",
            message: "What is the name of the new department?"
        },
        {
            type: "number",
            name: "overheadCosts",
            message: "What is the overhead cost for this department?",
            validate: function(answer){
                const valid = !isNaN(answer);
                return valid;
            }
        }
    ]).then((response) => {
        connection.query(`INSERT INTO departments (department_name, over_head_costs) 
        VALUES ("${response.department}", "${response.overheadCosts}")`, async (err, data) => {
            if (err) throw err;
            await queryDB();
            supervisorPortal();
        });
    }).catch(err => console.error(err))
}

module.exports = {
    connectDB
}