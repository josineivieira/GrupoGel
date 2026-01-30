# Deploy automático no DigitalOcean (cloud-init)

Use o arquivo `deploy/cloud-init/do-user-data-digitalocean.yml` como User Data ao criar um Droplet no DigitalOcean. Antes de criar o droplet, substitua os seguintes placeholders:

- `REPLACE_WITH_GIT_REPO` → URL do repositório Git (ex: `https://github.com/youruser/yourrepo.git`)
- `REPLACE_WITH_DOMAIN` → domínio que você quer usar (ex: `app.seudominio.com`). Se não usar domínio, mude `REACT_APP_API_URL` para `http://<DROPLET_IP>:5000/api` depois do provisionamento.

Passos rápidos:
1. No painel do DigitalOcean, clique em "Create Droplet" → escolha Ubuntu 22.04.
2. Em "User Data" cole o conteúdo de `deploy/cloud-init/do-user-data-digitalocean.yml` (após substituir os placeholders).
3. Adicione sua chave SSH (recommended) na seção "Authentication" para poder logar como root.
4. Crie o droplet e aguarde o provisionamento.
5. Acesse via SSH: `ssh root@<droplet-ip>`.
6. Verifique status dos serviços:
   - `sudo systemctl status geo-delivery.service`
   - `sudo docker compose ps`
   - `sudo journalctl -u geo-delivery -f`
7. Verifique a API:
   - `curl -i https://<your-domain>/api/health` (deve retornar JSON com success: true)

Se quiser que eu gere o `do-user-data-digitalocean.yml` já preenchido com seu repositório e domínio, me diga o repo URL e o domínio que quer usar e eu gero o arquivo pronto para colar no painel do DigitalOcean.