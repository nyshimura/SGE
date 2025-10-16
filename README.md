
# Sistema de Gestão Escolar - Pronto para Produção

Este projeto é um sistema de gestão escolar completo com backend em PHP e frontend em TypeScript/React.

## Arquitetura

O sistema é dividido em duas partes principais:

1.  **Backend (Pasta `api/`)**: Uma API em PHP que se conecta a um banco de dados MySQL/MariaDB para gerenciar todos os dados da aplicação.
2.  **Frontend (Arquivos na raiz)**: Uma Single-Page Application (SPA) construída com TypeScript que consome os dados da API PHP.

## Requisitos de Servidor

*   Servidor web com suporte a PHP (ex: Apache, Nginx).
*   Banco de dados MySQL ou MariaDB.
*   Node.js e npm (necessário apenas na sua máquina local para compilar o frontend).

## Passos para Instalação e Deploy

Siga estes passos para colocar o sistema em produção.

### Passo 1: Configurar o Banco de Dados

1.  **Crie um Banco de Dados**: Use o painel de controle da sua hospedagem (ex: cPanel, Plesk) ou uma ferramenta como o phpMyAdmin para criar um novo banco de dados. Anote o nome do banco de dados, o usuário e a senha.
2.  **Importe o Schema**: Importe o arquivo `schema.sql` para o banco de dados que você acabou de criar. Isso criará todas as tabelas necessárias e inserirá os dados iniciais (como o usuário superadmin).

### Passo 2: Configurar e Fazer Upload do Backend

1.  **Edite o Arquivo de Configuração**: Abra o arquivo `api/config.php`. Altere as seguintes linhas com as credenciais do seu banco de dados:
    ```php
    define('DB_USER', 'SEU_USUARIO_DO_BANCO');
    define('DB_PASS', 'SUA_SENHA_DO_BANCO');
    define('DB_NAME', 'SEU_NOME_DO_BANCO');
    ```
2.  **Faça o Upload**: Envie a pasta `api` inteira para a raiz do seu servidor web (ex: para a pasta `public_html`).



### Passo 4: Acessar a Aplicação

Após o upload de todos os arquivos, você pode acessar seu site pelo seu domínio. O sistema estará funcionando.

**Login Padrão (Super Admin):**
*   **Email**: `admin@admin`
*   **Senha**: `admin`

## Configurações Adicionais (Opcional)


