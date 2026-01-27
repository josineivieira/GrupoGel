# 📱 Como compartilhar o app com outras pessoas

## 🔗 Link para acessar:
```
http://192.168.1.3:3000
```

## 📲 QR Code para celular:
**Abra o arquivo `ACESSO.html` no navegador para ver o QR code**

---

## 🔐 Credenciais de acesso:

### Motorista (Entregador):
- **Email:** motorista@example.com
- **Senha:** senha123

### Admin (Gerente):
- **Email:** admin@example.com
- **Senha:** admin123

---

## ✅ Pré-requisitos para acessar:

1. **Estar na mesma rede Wi-Fi** do computador
2. **Ter o app rodando** (execute START_EXTERNAL.bat)
3. **Ter o IP correto** (192.168.1.3)

---

## 📍 Se o IP mudou:

Se seu computador receber outro IP da rede, atualize:

1. Execute `ipconfig` no terminal
2. Procure por "IPv4 Address" na seção da sua rede
3. Atualize o arquivo `.env.local` em `frontend/`
4. Reinicie o app

---

## 🌐 Compartilhar na INTERNET (fora da rede):

Se quiser que pessoas de fora da rede acessem, use **ngrok**:

### Passos:
1. Baixe ngrok: https://ngrok.com/download
2. Extraia o arquivo
3. Execute no terminal:
   ```
   ngrok http 3000
   ```
4. Copie a URL gerada e compartilhe com outras pessoas

---

## 🚀 Arquivos úteis:

- **START_EXTERNAL.bat** - Inicia o app com acesso externo
- **ACESSO.html** - Página com QR code e instruções
- **frontend/.env.local** - Configuração do IP da sua máquina

---

## 💡 Dicas:

- O app funciona melhor em redes 5GHz
- Se a conexão estiver lenta, reinicie o app
- Limpe o cache do navegador se tiver problemas
- Use navegadores modernos (Chrome, Firefox, Safari)

---

## 📞 Suporte:

Se tiver problemas:
1. Verifique se backend e frontend estão rodando
2. Verifique se o celular está na mesma rede
3. Tente acessar localhost:3000 no PC primeiro
4. Reinicie o app e o celular
