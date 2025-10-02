# Backend SGE

### Instalação
1. Importe `database.sql` no MySQL do Hostinger
2. Configure `config.php` com o banco
3. Suba `api.php`, `config.php` e proteja os arquivos
4. Aponte seu frontend SPA para endpoints /api/... (AJAX)

Endpoints:
POST /api/login (email, senha)
GET /api/users
GET /api/courses
Adapte/add endpoints no api.php conforme novas features
