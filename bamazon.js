var customer = require("./customer.js");
var manager = require("./manager.js");
var supervisor = require("./supervisor.js");
var inquirer = require("inquirer");

console.log("\nWELCOME TO BAMAZON\N")

inquirer.prompt([
    {
        type: "list",
        name: "login",
        message: "Login as: ",
        choices: ["Customer", "Manager", "Supervisor"]
    }
]).then((res) => {
    if (res.login === "Customer") {
        customer.connectDB();
    } else if (res.login === "Manager") {
        manager.connectDB();
    } else if (res.login === "Supervisor") {
        supervisor.connectDB();
    } else {
        console.log("Please make a selection to continue");
    }
}).catch((err => console.error(err)));