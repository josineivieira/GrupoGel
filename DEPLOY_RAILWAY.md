# 🚀 Guia de Deploy - Railway.app

## Passo 1: Preparar o repositório Git

```bash
cd c:\Users\Josinei\Documents\App
git init
git add .
git commit -m "Initial commit - GeoTransportes Delivery App"
```

## Passo 2: Criar conta no Railway

1. Acesse https://railway.app
2. Clique em "Start a New Project"
3. Conecte sua conta GitHub

## Passo 3: Deploy no Railway

### Opção A: Via GitHub (Recomendado)
1. Push seu código para GitHub
2. No Railway, clique "Deploy from GitHub"
3. Selecione o repositório
4. Railway fará deploy automático

### Opção B: Via CLI
1. Instale Railway CLI: `npm install -g @railway/cli`
2. Execute: `railway login`
3. Execute: `railway init`
4. Execute: `railway up`

## Passo 4: Configurar variáveis de ambiente

No Railway dashboard, adicione:

```
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_mude_em_producao
NODE_ENV=production
PORT=3000
```

## Passo 5: Verificar estrutura de pasta

Railway espera encontrar:
```
/backend/src/server.js (arquivo principal)
/frontend/build (pasta gerada após build)
```

## Links úteis

- Railway docs: https://docs.railway.app
- Status: https://railway.app/status
- Suporte: support@railway.app

## Após Deploy

A app estará disponível em uma URL como:
```
https://seu-app-name.up.railway.app
```

## Troubleshooting

Se houver erro 503 ou aplicação não iniciar:

1. Verifique os logs no Railway dashboard
2. Certifique-se que package.json tem scripts corretos
3. Verifique se `backend/src/server.js` existe
4. Reinicie a aplicação no Railway

---

**Dúvidas?** Me chame! 🚀
