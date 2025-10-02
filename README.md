# Sistema de Gestão Escolar - Protótipo

Este é um protótipo interativo de um Sistema de Gestão Escolar (SGE) construído como uma aplicação web de página única (SPA). Ele demonstra os fluxos de trabalho essenciais para diferentes perfis de usuário: Alunos, Professores e Administradores.

## Funcionalidades

- **Múltiplos Perfis de Usuário:** Painéis personalizados para alunos, professores, administradores e superadmins.
- **Gerenciamento de Cursos:** Criação, edição e visualização de detalhes dos cursos.
- **Matrículas:** Alunos podem se inscrever em cursos, e administradores podem aprovar as matrículas.
- **Controle de Frequência:** Professores e administradores podem registrar a presença e ausência dos alunos.
- **Painel Financeiro:** Geração automática de mensalidades, controle de pagamentos e dashboards visuais com gráficos de receita.
- **Pagamento com PIX:** Geração simulada de QR Code e código "copia e cola" para pagamento de mensalidades.
- **Personalização:** Possibilidade de arrastar e soltar os cards no painel para organizar o layout.
- **Segurança:** Simulação de hash de senhas e fluxo de redefinição de senha.
- **Instalador Guiado:** Um processo de instalação inicial para configurar o sistema pela primeira vez.

## Instalação

Ao acessar a aplicação pela primeira vez, você será redirecionado para um assistente de instalação guiado. Siga as etapas para configurar:

1.  **Banco de Dados:** Simule a configuração da conexão com o banco de dados.
2.  **Conta Super Admin:** Crie a sua conta principal de superadministrador.
3.  **Configuração de E-mail (SMTP):** Opcionalmente, configure as definições de SMTP para o envio de e-mails (como redefinição de senha).

Após a conclusão, o sistema será populado com dados de exemplo e você será redirecionado para a tela de login.

## Credenciais de Login Padrão

As seguintes contas de usuário são criadas pelo instalador para facilitar os testes.

| Função         | E-mail            | Senha |
| -------------- | ----------------- | ----- |
| **Super Admin**  | `admin@admin`     | `admin` |
| Administrador  | `carlos@email.com`| `123`   |
| Professor      | `silva@email.com` | `123`   |
| Aluno (Ana)    | `ana@email.com`   | `123`   |
| Aluno (Marcos) | `marcos@email.com`| `123`   |


Criar o db_config.php na pasta API
// <?php
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
?> //


Login.php na pasta api

// <?php
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// A lógica de hash aqui replica a do seu protótipo para manter a compatibilidade.
// Em um projeto real, use as funções password_hash() e password_verify() do PHP.
$salt = 'SGE_PROTOTYPE_SALT_v1';
$hashedPassword = base64_encode($password . $salt);

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
$stmt->bind_param("ss", $email, $hashedPassword);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    unset($user['password']); // Nunca envie a senha de volta!
    echo json_encode($user);
} else {
    http_response_code(401); // Não autorizado
    echo json_encode(["error" => "Email ou senha inválidos."]);
}

$stmt->close();
$conn->close();
?>
//

O passo final é modificar seu código original para que ele converse com o PHP.

No seu projeto no Linux Mint, abra o arquivo index.tsx.

Encontre a função window.handleLogin e substitua-a pela versão abaixo, que usa fetch para chamar a API.

// Em index.tsx, substitua a função antiga por esta:
window.handleLogin = async (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
        // A mágica acontece aqui!
        const response = await fetch('/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data; // Armazena o usuário retornado pelo PHP
            currentView = 'dashboard';
        } else {
            alert(data.error || 'Email ou senha inválidos.');
        }
    } catch (error) {
        alert('Erro de comunicação com o servidor. Verifique sua conexão.');
    }
    render(); // Atualiza a tela
};
//
