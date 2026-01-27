# 🔗 Link FIXO e PERMANENTE para motoristas

## ⭐ Melhor opção: Cloudflare Tunnel (GRATUITO)

Cloudflare Tunnel oferece:
- ✅ Link fixo que **não muda**
- ✅ Totalmente **GRATUITO**
- ✅ Rápido e confiável
- ✅ Sem limite de tempo

---

## 📥 Instalação

### Passo 1: Baixe o Cloudflare Tunnel
1. Acesse: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Baixe para Windows
3. Extraia em uma pasta (ex: `C:\cloudflare`)

Ou use chocolatey (se tiver):
```powershell
choco install cloudflare-warp
```

### Passo 2: Crie uma conta Cloudflare (GRATUITA)
1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie uma conta (usar email é rápido)
3. Confirme o email

### Passo 3: Configure o domínio

**Opção A: Use um domínio que já tem** (recomendado)
1. Vá em https://dash.cloudflare.com/
2. Adicione seu domínio
3. Siga as instruções

**Opção B: Use domínio grátis do Cloudflare**
- Você vai ter um subdomínio tipo: `deliverydocs.cloudflare.workers.dev`

---

## 🚀 Como usar

### Terminal 1: Inicie o app
```batch
START_EXTERNAL.bat
```

### Terminal 2: Configure o tunnel

```powershell
# Faça login (abre navegador automaticamente)
cloudflared login

# Crie o tunnel
cloudflared tunnel create deliverydocs

# Anote a URL que apareceu!
```

### Terminal 3: Redirecione o tráfego

```powershell
cloudflared tunnel route dns deliverydocs seudominio.com
```

Ou se usar subdomínio:
```powershell
cloudflared tunnel route dns deliverydocs app.seudominio.com
```

### Terminal 4: Inicie o tunnel

```powershell
cloudflared tunnel run deliverydocs
```

---

## 📝 Arquivo de configuração automático

Crie `cloudflared-config.yml` na pasta do app:

```yaml
tunnel: deliverydocs
ingress:
  - hostname: app.seudominio.com
    service: http://localhost:3000
  - service: http_status:404
```

Depois execute:
```powershell
cloudflared tunnel run --config cloudflared-config.yml deliverydocs
```

---

## 🔗 Link final para motoristas

```
https://app.seudominio.com
```

ou

```
https://deliverydocs.cloudflare.workers.dev
```

---

## 🎯 Resumo com seu domínio

Se você tem domínio `minhaempresa.com.br`:

1. Adicione em Cloudflare
2. Configure tunnel
3. Link para motoristas:
   ```
   https://app.minhaempresa.com.br
   ```

**Nunca mais muda!** ✅

---

## 💡 Alternativas

### Se não quer usar Cloudflare:

#### 1. **Localtunnel** (gratuito, link muda)
```powershell
npm install -g localtunnel
lt --port 3000
```

#### 2. **Render/Vercel** (deploy completo - recomendado)
Faz deploy do seu app na internet
- Cloudflare Pages (frontend)
- Render (backend)

#### 3. **ngrok PRO** (pago)
Link fixo
Custa $10/mês

---

## 🆘 Troubleshooting Cloudflare

### Erro "Permission denied"
```powershell
# Execute como administrador
# Clique direito no PowerShell → "Executar como administrador"
```

### Tunnel não conecta
```powershell
# Verifique o status
cloudflared tunnel list

# Teste a URL
curl https://app.seudominio.com
```

---

## ✅ Checklist Final

- [ ] Conta Cloudflare criada
- [ ] Domínio adicionado (ou usar subdomínio free)
- [ ] `cloudflared` instalado
- [ ] Tunnel criado
- [ ] App rodando (START_EXTERNAL.bat)
- [ ] Tunnel rodando
- [ ] Link testado no navegador
- [ ] Link compartilhado com motoristas

---

**Pronto! Link fixo para sempre!** 🎉
