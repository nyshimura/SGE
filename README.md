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
