<?php
require_once 'config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
$request = $_SERVER['REQUEST_URI'];
$method  = $_SERVER['REQUEST_METHOD'];
parse_str(file_get_contents('php://input'), $input);
// Login
if ($request == '/api/login' && $method == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $user = $db->fetch('SELECT * FROM users WHERE email=?', [$data['email']]);
    if($user && ($user['password'] == $data['password'] || password_verify($data['password'], $user['password']))) {
        unset($user['password']);
        echo json_encode(['success'=>true,'user'=>$user]);
    } else {
        echo json_encode(['error'=>'Credenciais inválidas']);
    }
    exit;
}
// Usuários
if ($request == '/api/users' && $method == 'GET') {
    $users = $db->fetchAll('SELECT * FROM users');
    foreach($users as &$u) unset($u['password']);
    echo json_encode($users);
    exit;
}
// Cursos
if ($request == '/api/courses' && $method == 'GET') {
    $courses = $db->fetchAll('SELECT * FROM courses');
    echo json_encode($courses);
    exit;
}
// (adapte para outros endpoints conforme necessário)
echo json_encode(['error'=>'Endpoint não encontrado']);
?>