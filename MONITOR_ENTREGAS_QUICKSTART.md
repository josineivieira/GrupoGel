# 🎯 Guia Rápido - Monitor de Entregas

## Acessar a Tela

```
Home → "Monitor de Entregas" (card vermelho) → /monitor-entregas
```

## Layout da Página

```
┌─────────────────────────────────────────────────┐
│ ← Voltar      📊 Monitor de Entregas    [Atualizar]
├─────────────────────────────────────────────────┤
│                                                 │
│  [Total: 42] [Entregues: 35] [Rascunho: 7] [Motoristas: 12]
│                                                 │
├─────────────────────────────────────────────────┤
│ ☐ Auto Atualizar  🔄 A cada [30] segundos     │
├─────────────────────────────────────────────────┤
│ ▶ Filtros                                       │
│   Status: [Todos▼]  |  Buscar: [________]     │
│   Data Inicial: [______]  Data Final: [______] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Tabela com Entregas:                           │
│ ┌──────┬──────────┬────────┬────────┬────────┐ │
│ │ #    │ Motorista│ Placa  │ Status │ Ações  │ │
│ ├──────┼──────────┼────────┼────────┼────────┤ │
│ │ENT001│João Silva│ ABC1234│✓ OK    │[Ver]   │ │
│ │ENT002│Maria S.  │ XYZ9999│⏳ Rascunho│[Ver]   │ │
│ │ENT003│Pedro M.  │ DEF5678│✓ OK    │[Ver]   │ │
│ └──────┴──────────┴────────┴────────┴────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Modal de Detalhes (Ao clicar "Visualizar")

```
┌─────────────────────────────────────────┐
│ 🔴 Entrega #ENT001                  [X] │
├─────────────────────────────────────────┤
│                                         │
│ MOTORISTA: João Silva                  │
│ EMAIL: joao@email.com                  │
│ PLACA: ABC-1234                        │
│ STATUS: ✓ Entregue                     │
│                                         │
│ OBSERVAÇÕES:                           │
│ ┌───────────────────────────────────┐  │
│ │ Entrega realizada com sucesso     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ DOCUMENTOS ANEXADOS:                   │
│ ┌─────────────────────────────────┐    │
│ │ 📄 NF                [Baixar]    │    │
│ │ 📦 CTE               [Baixar]    │    │
│ │ 📓 Diário            [Baixar]    │    │
│ │ 🚛 Devolução Vazio   [Baixar]    │    │
│ │ 🚚 Retirada Cheio    [Baixar]    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ Criado em: 25/01/2026 às 14:30         │
│                                         │
└─────────────────────────────────────────┘
```

## Fluxo de Uso

### 1️⃣ Monitoramento em Tempo Real
```
Ativar "Auto Atualizar" 
    ↓
Escolher intervalo (ex: 30s)
    ↓
Página recarrega automaticamente
    ↓
Novos dados aparecem na tabela
```

### 2️⃣ Filtrar Entregas
```
Clicar em "▶ Filtros"
    ↓
Selecionar Status (Todos/Entregues/Rascunho)
    ↓
Digitar busca (número, motorista, placa)
    ↓
Intervalo de datas (opcional)
    ↓
Resultados filtrados aparecem
```

### 3️⃣ Visualizar Detalhes
```
Clicar "[Ver]" em uma entrega
    ↓
Modal abre com informações completas
    ↓
Ver documentos anexados
    ↓
Baixar documentos necessários
    ↓
Fechar modal (botão X)
```

## Status Badges

| Status | Cor | Significado |
|--------|-----|-------------|
| ✓ Entregue | 🟢 Verde | Entrega concluída |
| ⏳ Rascunho | 🟡 Amarelo | Ainda sendo preenchida |

## Documentos Disponíveis

| Ícone | Código | Nome Completo |
|-------|--------|---|
| 📄 | canhotNF | Canhoto Nota Fiscal |
| 📦 | canhotCTE | Canhoto CT-e |
| 📓 | diarioBordo | Diário de Bordo |
| 🚛 | devolucaoVazio | Devolução Vazio |
| 🚚 | retiradaCheio | Retirada Cheio |

## Atalhos de Teclado

*(Futuro)*
- `Ctrl + F` - Ativar busca rápida
- `R` - Atualizar página
- `T` - Ir para topo

## Dúvidas Frequentes

**P: Posso baixar múltiplos documentos de uma vez?**
A: Por enquanto, um por um. Futuro: implementar bulk download.

**P: A página se atualiza se eu fechar a aba?**
A: Não. O auto-refresh funciona apenas enquanto a aba está ativa.

**P: Quantas entregas aparecem por página?**
A: Sem paginação agora - todas as entregas filtradas aparecem.

**P: Posso editar entregas daqui?**
A: Não, apenas visualizar e baixar. Edição futura conforme necessidade.

---

**💡 Dica**: Use intervalos menores (5-10s) para monitoramento ativo, maiores (60s+) para verificação ocasional.
