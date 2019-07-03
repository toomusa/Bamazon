DROP DATABASE IF EXISTS bamazon_db;

CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE products (
    item_id INTEGER (5) AUTO_INCREMENT NOT NULL,
    product_name VARCHAR (100) NOT NULL,
    department_name VARCHAR (100) NOT NULL,
    price DECIMAL (10,2) NOT NULL,
    stock_quantity INTEGER (5) NOT NULL,
    product_sales DECIMAL (10,2) NULL DEFAULT 0,
    sold_quantity INTEGER (5) Null DEFAULT 0,
    PRIMARY KEY (item_id)
);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES 
("Smart-Watch", "Electronics", 200.00, 20),
("60-inch 4k TV", "Electronics", 450.00, 15),
("2-in-1 Laptop", "Electronics", 800.00, 10),
("Smart-Home Kit", "Electronics", 150.00, 10),
("Gaming Console", "Electronics", 250.00, 15),
("Supreme Pizza", "Foods", 20.00, 20),
("Wagyu Steak", "Foods", 55.00, 10),
("Poo Poo Platter", "Foods", 15.00, 15),
("Heirloom Salad", "Foods", 10.00, 15),
("Lasagna Arrabiata", "Foods", 25.00, 10),
("Dress Pants", "Clothing", 40.00, 15),
("White Shirt", "Clothing", 35.00, 20),
("Sports Coat", "Clothing", 65.00, 10),
("Fancy Sneakers", "Clothing", 50.00, 10),
("Leather Belt", "Clothing", 20.00, 30);

CREATE TABLE departments (
    department_id INTEGER (5) AUTO_INCREMENT NOT NULL,
    department_name VARCHAR (100) NOT NULL,
    over_head_costs DECIMAL (10,2) NOT NULL,
    PRIMARY KEY (department_id)
);

INSERT INTO departments (department_name, over_head_costs)
VALUES 
("Electronics", 1000.00),
("Foods", 500.00),
("Clothing", 700.00);

SELECT * FROM products;

SELECT * FROM departments;