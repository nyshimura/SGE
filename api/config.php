<?php
// Configuração do Banco (Hostinger)
define('DB_HOST', 'localhost');
define('DB_USER', 'u821635548_base');
define('DB_PASS', '100Senha!S');
define('DB_NAME', 'u821635548_sistema');
define('DB_PORT', '3306');

date_default_timezone_set('America/Sao_Paulo');

class Database {
    public $conn;
    public function __construct() {
        $dsn = "mysql:host=".DB_HOST.";port=".DB_PORT.";dbname=".DB_NAME.";charset=utf8mb4";
        $this->conn = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]);
    }
    public function query($sql, $params=[]) {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    public function fetch($sql, $params=[]) {
        return $this->query($sql, $params)->fetch();
    }
    public function fetchAll($sql, $params=[]) {
        return $this->query($sql, $params)->fetchAll();
    }
    public function lastId() {
        return $this->conn->lastInsertId();
    }
}
$db = new Database();
?>