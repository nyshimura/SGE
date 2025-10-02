<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Permite requisições de qualquer origem (útil para desenvolvimento)
header("Access-Control-Allow-Headers: Content-Type");

$servername = "localhost"; // Mantenha localhost
$username = "SEU_USUARIO_DO_BANCO"; // Ex: u123456_sge_usuario
$password = "SUA_SENHA_DO_BANCO";
$dbname = "SEU_NOME_DO_BANCO";   // Ex: u123456_sge_dados

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Falha na conexão: " . $conn->connect_error]));
}
$conn->set_charset("utf8");
?>