USE bamazon_db;

CREATE TABLE departments (
    department_id INTEGER (5) AUTO_INCREMENT NOT NULL,
    department_name VARCHAR (100) NOT NULL,
    over_head_costs DECIMAL (10,2) NOT NULL,
    PRIMARY KEY (department_id)
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

SELECT * FROM products;