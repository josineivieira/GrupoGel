# Deploy no VPS (Ubuntu) - passo a passo rápido

Este guia assume acesso SSH ao servidor (Ubuntu 22.04 LTS recomendado) e que você quer rodar o aplicativo via Docker Compose.

1) Preparação do servidor

```bash
# Atualizar
sudo apt update && sudo apt upgrade -y
# Instalar dependências (Docker + Compose)
sudo apt install -y ca-certificates curl gnupg lsb-release
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
# Adicionar docker-compose (plugin) se necessário
sudo apt install -y docker-compose-plugin
# Adicionar seu usuário ao grupo docker (opcional)
sudo usermod -aG docker $USER
```

2) Copiar o projeto para o servidor

- Clone o repositório git no servidor:
```bash
cd /opt
sudo git clone <seu-repo-url> geo-delivery
cd geo-delivery
```

- (Se não usar git) copie os arquivos via SCP/rsync

3) Configurar variáveis de ambiente

- Edite `.env` na raiz do projeto e defina `JWT_SECRET`, `PORT` se desejar, etc. Certifique-se que `frontend/.env` tenha `REACT_APP_API_URL` apontando para `http://<SEU_HOST>:5000/api` (útil para subdomínios, etc.)

4) Criar backups (opcional)

Antes do deploy, salve o DB e uploads:
```bash
sudo scripts/backup.sh
```

5) Rodar com Docker Compose

```bash
sudo scripts/deploy.sh
```

6) Habilitar serviço para iniciar no boot (systemd)

```bash
sudo cp deploy/systemd/geo-delivery.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now geo-delivery.service
sudo systemctl status geo-delivery.service
```

7) TLS/HTTPS

Recomendo usar Caddy (config simples e TLS automático) ou configurar Nginx + Certbot.

Exemplo rápido com Caddy (instalar Caddy e criar `Caddyfile`):
```
example.com {
  reverse_proxy localhost:5000
}
```

8) Logs e troubleshooting

- Ver logs:
```
docker compose logs -f
```
- Entrar no container:
```
docker compose exec app bash
```

9) Atualizar:

```
cd /opt/geo-delivery
git pull origin main
sudo scripts/deploy.sh
```

---

Se quiser, eu gero um `User Data` script para automação na criação de um droplet (DigitalOcean) ou um *playbook* Ansible básico para provisionamento; me diga o provedor que você prefere e eu adapto o script.