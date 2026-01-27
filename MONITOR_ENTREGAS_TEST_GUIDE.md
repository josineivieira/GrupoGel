# 🧪 Guia de Teste - Monitor de Entregas

## Pré-requisitos

- ✅ Aplicação rodando (`npm run dev`)
- ✅ MongoDB conectado
- ✅ Conta admin criada
- ✅ Pelo menos 1 entrega no banco

---

## 🔧 Setup Inicial

### 1. Iniciar a Aplicação
```bash
cd "c:\Users\Josinei\Documents\App"
npm run dev
```

Deve mostrar:
```
Backend: http://localhost:5000
Frontend: http://localhost:3000
```

### 2. Verificar Banco de Dados
```bash
# No MongoDB Compass ou mongosh, verificar:
db.deliveries.find().limit(1)  // Deve retornar pelo menos 1
db.drivers.find().limit(1)     // Deve ter usuários
```

### 3. Criar Admin (se não tiver)
Via POST `/api/auth/register`:
```json
{
  "name": "Admin Teste",
  "username": "admin",
  "email": "admin@test.com",
  "password": "senha123",
  "role": "admin"
}
```

---

## 📝 Testes Manual

### Teste 1: Login como Admin ✅

**Passos:**
1. Abrir `http://localhost:3000/login`
2. Preencher credenciais admin
3. Clicar "Entrar"

**Resultado Esperado:**
- ✅ Redireciona para `/home`
- ✅ Mostra nome do admin no cabeçalho
- ✅ Aparece card "Monitor de Entregas"

---

### Teste 2: Acessar Monitor de Entregas 🎯

**Passos:**
1. Na home, procurar card vermelho "Monitor de Entregas"
2. Clicar no card

**Resultado Esperado:**
- ✅ Navega para `/monitor-entregas`
- ✅ Mostra estatísticas (Total, Entregues, Rascunho, Motoristas)
- ✅ Exibe tabela com entregas
- ✅ Dados carregam sem erros

**Console:**
```
// Não deve haver erros vermelhos (F12)
```

---

### Teste 3: Verificar Dashboard Stats 📊

**Passos:**
1. Observar 4 cards de estatísticas

**Resultado Esperado:**
- ✅ **Total**: Soma de todas as entregas
- ✅ **Entregues**: Count `status === 'submitted'`
- ✅ **Rascunho**: Count `status === 'draft'`
- ✅ **Motoristas**: Count de nomes únicos

**Validação:**
```javascript
// Console do navegador:
deliveries.filter(d => d.status === 'submitted').length
// Deve bater com número no card "Entregues"
```

---

### Teste 4: Tabela de Entregas 📋

**Passos:**
1. Observar coluna da tabela

**Resultado Esperado:**
- ✅ **Número**: Código da entrega (ENT001, etc)
- ✅ **Motorista**: Nome do motorista
- ✅ **Placa**: Veículo (ABC-1234)
- ✅ **Status**: Badge verde (Entregue) ou amarela (Rascunho)
- ✅ **Data**: Data de criação formatada
- ✅ **Documentos**: ✓ para cada documento anexado
- ✅ **Ações**: Botão "Visualizar"

**Validação Visual:**
- Linhas alternadas (branco/cinza)
- Hover mostra fundo diferente
- Sem quebra de layout em nenhuma coluna

---

### Teste 5: Auto Refresh ⏰

**Passos:**
1. Procurar checkbox "Auto Atualizar"
2. Marcar o checkbox
3. Especificar intervalo (ex: 10 segundos)
4. Esperar atualização

**Resultado Esperado:**
- ✅ Checkbox marcado
- ✅ Mostra "A cada 10 segundos"
- ✅ Spinner no botão "Atualizar" 
- ✅ Toast aparece ("Carregadas X entregas")
- ✅ Dados atualizam a cada intervalo

**Validação:**
```javascript
// Abrir DevTools (F12) → Network
// Verificar requisição GET /api/admin/deliveries
// A cada 10 segundos (ou intervalo definido)
```

**Teste Negativo:**
1. Desmarcar checkbox
2. Esperar mais que o intervalo
3. Dados não devem atualizar

---

### Teste 6: Filtro por Status 🎯

**Passos 1 - Filtrar por Entregues:**
1. Clicar "▶ Filtros" (expandir painel)
2. Na primeira combobox, selecionar "Entregues"
3. Observar tabela

**Resultado Esperado:**
- ✅ Painel filtros abre
- ✅ Combobox muda para "Entregues"
- ✅ Tabela mostra APENAS status `submitted`
- ✅ Outros status desaparecem

**Passos 2 - Filtrar por Rascunho:**
1. Mudar combobox para "Rascunho"
2. Observar tabela

**Resultado Esperado:**
- ✅ Tabela mostra APENAS status `draft`

**Passos 3 - Mostrar Todos:**
1. Mudar combobox para "Todos"
2. Observar tabela

**Resultado Esperado:**
- ✅ Tabela mostra todos os registros

---

### Teste 7: Busca por Texto 🔍

**Passos 1 - Buscar por Número:**
1. Expandir Filtros
2. No campo "Buscar", digitar número de entrega (ex: "001")
3. Teclar Enter ou aguardar

**Resultado Esperado:**
- ✅ Tabela filtra para números contendo "001"

**Passos 2 - Buscar por Motorista:**
1. Limpar campo
2. Digitar parte do nome (ex: "João")
3. Aguardar

**Resultado Esperado:**
- ✅ Filtra entregas do motorista "João"

**Passos 3 - Buscar por Placa:**
1. Limpar campo
2. Digitar placa (ex: "ABC")
3. Aguardar

**Resultado Esperado:**
- ✅ Filtra entregas da placa "ABC-1234"

**Passos 4 - Busca Vazia:**
1. Limpar campo (deixar em branco)
2. Aguardar

**Resultado Esperado:**
- ✅ Mostra TODAS as entregas novamente

---

### Teste 8: Filtro por Data 📅

**Passos 1 - Data Inicial:**
1. Expandir Filtros
2. Clicar em "Data Inicial"
3. Selecionar data (ex: 20/01/2026)
4. Observar tabela

**Resultado Esperado:**
- ✅ Filtra apenas entregas >= 20/01/2026
- ✅ Entregas mais antigas desaparecem

**Passos 2 - Data Final:**
1. Clicar em "Data Final"
2. Selecionar data (ex: 25/01/2026)
3. Observar tabela

**Resultado Esperado:**
- ✅ Filtra apenas entregas entre 20/01 e 25/01
- ✅ Entregas futuras desaparecem

**Passos 3 - Limpar Filtro:**
1. Limpar datas (deixar em branco)
2. Aguardar

**Resultado Esperado:**
- ✅ Mostra todas as entregas novamente

---

### Teste 9: Visualizar Detalhes 👁️

**Passos:**
1. Clicar botão "Visualizar" em uma entrega
2. Observar modal

**Resultado Esperado:**
- ✅ Modal abre com fundo escuro
- ✅ Header gradient purple
- ✅ Mostra número da entrega
- ✅ Botão X para fechar no canto superior direito

**Conteúdo do Modal:**
```
MOTORISTA: [Nome completo]
EMAIL: [Email do motorista]
PLACA: [Placa do veículo]
STATUS: [Verde: Entregue | Amarelo: Rascunho]
OBSERVAÇÕES: [Texto, se houver]
DOCUMENTOS ANEXADOS:
  - 📄 NF [Botão Baixar]
  - 📦 CTE [Botão Baixar]
  - 📓 Diário [Botão Baixar]
  - 🚛 Vazio [Botão Baixar]
  - 🚚 Cheio [Botão Baixar]
Criado em: [Data/hora formatada]
```

**Validação:**
- ✅ Todos os dados aparecem corretamente
- ✅ Documentos que existem têm botão [Baixar] verde
- ✅ Documentos que não existem mostram "Não anexado"
- ✅ Modal é responsivo (tente redimensionar janela)

---

### Teste 10: Download de Documentos 📥

**Pré-requisito:** Ter pelo menos uma entrega com documentos

**Passos:**
1. Abrir modal de uma entrega
2. Procurar documento que tem status ✓ (anexado)
3. Clicar botão [Baixar]

**Resultado Esperado:**
- ✅ Arquivo começa a fazer download
- ✅ Nome do arquivo: `[tipoDocumento]_[numeroEntrega].jpg`
- ✅ Toast aparece: "Documento baixado"
- ✅ Arquivo está legível (imagem/PDF)
- ✅ Arquivo aparece em Downloads

**Teste Negativo:**
1. Tentar baixar documento que não tem ✓
2. Clicar botão [Baixar] em "Não anexado"

**Resultado Esperado:**
- ✅ Toast de erro aparece: "Erro ao baixar arquivo"
- ✅ Nada faz download

---

### Teste 11: Fechar Modal 🚪

**Passos 1 - Botão X:**
1. Modal aberto
2. Clicar botão X (canto superior direito)
3. Observar

**Resultado Esperado:**
- ✅ Modal fecha suavemente
- ✅ Volta para tabela
- ✅ Scroll da página volta ao topo

**Passos 2 - Clicar Fora:**
1. Modal aberto
2. Clicar fora do modal (fundo preto)

**Resultado Esperado:**
- ✅ Modal fecha
- ✅ Tabela fica visível

---

### Teste 12: Responsividade 📱

**Mobile (320px - 640px):**
1. Abrir DevTools (F12)
2. Ativar modo responsivo (Ctrl+Shift+M)
3. Selecionar iPhone SE (375px)
4. Observar layout

**Resultado Esperado:**
- ✅ Stats em 1 coluna
- ✅ Tabela com scroll horizontal
- ✅ Filtros colapsáveis
- ✅ Modal adapta
- ✅ Sem cortes de texto
- ✅ Botões clicáveis (mín. 44px)

**Tablet (768px):**
1. Selecionar iPad (768px)
2. Observar layout

**Resultado Esperado:**
- ✅ Stats em 2 colunas
- ✅ Tabela legível
- ✅ Layout equilibrado

**Desktop (1920px):**
1. Maximizar janela
2. Observar layout

**Resultado Esperado:**
- ✅ Stats em 4 colunas
- ✅ Máxima largura (~7xl)
- ✅ Centrado na página
- ✅ Espaço em branco dos lados

---

### Teste 13: Motorista Não Consegue Acessar 🔒

**Passos:**
1. Fazer logout
2. Fazer login como motorista (não admin)
3. Tentar acessar `/monitor-entregas` na URL
4. Observar

**Resultado Esperado:**
- ✅ Redireciona para `/home`
- ✅ Não mostra tela do monitor
- ✅ Nenhuma mensagem de erro (behavior silencioso)

---

### Teste 14: Atualizar Manual 🔄

**Passos:**
1. Desativar "Auto Atualizar"
2. Esperar mais de 30 segundos
3. Clicar botão "Atualizar"

**Resultado Esperado:**
- ✅ Spinner aparece no botão
- ✅ Requisição é feita ao servidor
- ✅ Dados são recarregados
- ✅ Toast aparece
- ✅ Spinner desaparece

---

### Teste 15: Combinação de Filtros 🎭

**Passos:**
1. Expandir Filtros
2. Selecionar Status = "Entregues"
3. Digitar Busca = "João"
4. Selecionar Data = 20/01 a 25/01
5. Observar tabela

**Resultado Esperado:**
- ✅ Tabela mostra APENAS:
  - Entregas com status `submitted` E
  - Que contêm "João" no motorista E
  - Dentro da data especificada
- ✅ Se nenhum resultado, mostra mensagem "Nenhuma entrega encontrada"

---

## 🧠 Testes de Lógica

### Teste 16: Cálculo de Stats

**Preparação:**
1. Ter banco com:
   - 5 entregas com status `submitted`
   - 3 entregas com status `draft`
   - 2 motoristas únicos

**Passos:**
1. Abrir Monitor
2. Verificar stats

**Validação:**
- Total = 8 ✓
- Entregues = 5 ✓
- Rascunho = 3 ✓
- Motoristas = 2 ✓

---

### Teste 17: Filtro Local vs Remoto

**Conceito:**
- Busca e status são aplicados **localmente** (sem requisição)
- Datas também são aplicadas localmente

**Teste:**
1. Abrir DevTools → Network
2. Mudar Status filter
3. Observar requisições

**Resultado Esperado:**
- ✅ Nenhuma requisição GET é feita
- ✅ Dados atualizados instantaneamente

---

## ⚠️ Testes de Erro

### Teste 18: Sem Entregas

**Setup:**
1. Banco vazio (sem deliveries)

**Passos:**
1. Abrir Monitor

**Resultado Esperado:**
- ✅ Stats mostram 0
- ✅ Tabela mostra: "Nenhuma entrega encontrada"
- ✅ Sem erro na console

---

### Teste 19: API Desconectada

**Setup:**
1. Desligar backend (`Ctrl+C` no terminal)

**Passos:**
1. Tentar abrir Monitor
2. ou mudar filtro após desligar

**Resultado Esperado:**
- ✅ Toast de erro aparece: "Erro ao carregar entregas"
- ✅ Spinne desaparece
- ✅ Tabela mostra estado anterior (cache)

---

### Teste 20: Documento Não Encontrado

**Setup:**
1. Banco tem entrega
2. Mas arquivo .jpg foi deletado do `/uploads`

**Passos:**
1. Abrir modal
2. Clicar [Baixar] em documento que não existe

**Resultado Esperado:**
- ✅ Toast de erro: "Erro ao baixar arquivo"
- ✅ Não faz download de nada
- ✅ Modal continua aberto

---

## 📊 Checklist Final

Antes de considerar pronto:

- [ ] Login como admin funciona
- [ ] Monitor carrega entregas
- [ ] Dashboard stats corretos
- [ ] Tabela exibe dados
- [ ] Filtro Status funciona
- [ ] Busca por texto funciona
- [ ] Filtro de data funciona
- [ ] Combinação de filtros funciona
- [ ] Modal de detalhes abre
- [ ] Modal de detalhes fecha (X)
- [ ] Modal de detalhes fecha (clique fora)
- [ ] Download de documento funciona
- [ ] Toast aparece nos momentos certos
- [ ] Auto refresh funciona
- [ ] Layout responsivo mobile ✓
- [ ] Layout responsivo tablet ✓
- [ ] Layout responsivo desktop ✓
- [ ] Motorista não consegue acessar
- [ ] Sem erros console (F12)
- [ ] Performance boa (sem lag)

---

## 🎉 Resultado Final

Se todos os testes passarem:

✅ **Monitor de Entregas está pronto para produção!**

---

**Tempo de Teste Estimado:** 30-45 minutos
**Data**: 27 de Janeiro de 2026
**Versão**: 1.0.0
