CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 firstName VARCHAR(100),
 lastName VARCHAR(100),
 email VARCHAR(200) UNIQUE,
 password VARCHAR(255),
 role VARCHAR(20)
);
CREATE TABLE IF NOT EXISTS courses (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255),
 description TEXT,
 teacherId INT,
 totalSlots INT,
 status VARCHAR(20),
 monthlyFee DECIMAL(10,2)
);
INSERT INTO users (firstName,lastName,email,password,role)
 VALUES('Super','Admin','admin@admin','admin','superadmin'),
       ('Ana','Silva','ana@email.com','123','student'),
       ('Marcos','Costa','marcos@email.com','123','student'),
       ('João','Professor','joao@email.com','123','teacher');
INSERT INTO courses (name,description,teacherId,totalSlots,status,monthlyFee)
 VALUES('Matemática Básica','Curso para iniciantes',4,30,'Aberto',150.00),
       ('Português','Curso de português',4,25,'Aberto',120.00);
