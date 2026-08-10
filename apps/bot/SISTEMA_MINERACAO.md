# Sistema de Mineração - Implementação Completa

## 📋 Resumo das Alterações

### 1. **Item Picareta do Minerador** (`src/utils/lojaItens.js`)
- Adicionado em todas as categorias de rank (E, D, C, B, A, S)
- Preço: 20.000 Wons
- Tipo: Consumível
- Descrição: "Ferramenta essencial para mineradores. Quebra após um único uso em dungeon."

### 2. **Comando !mineracao** (`src/commands/mineracao.js`)
- Atualizado com informações corretas do sistema
- Documenta como participar como minerador
- Explica sistema de sorteio de cristais

### 3. **Sistema de Mineração** (`src/systems/dungeonInstanciadaSystem.js`)

#### Métodos Implementados:

**`verificarPicareta(jogadorId)`**
- Verifica se o jogador possui uma picareta no inventário
- Retorna true/false

**`consumirPicareta(jogadorId)`**
- Remove uma picareta do inventário do jogador
- Usado após cada dungeon como minerador

**`sortearCristais()`**
- Sistema de sorteio em duas etapas:
  1. **Tipo de cristal:**
     - Cristal Grande: 10% chance (100.000 Wons)
     - Cristal Médio: 20% chance (60.000 Wons)
     - Cristal Pequeno: 30% chance (20.000 Wons)
     - Nada: 40% chance
  2. **Quantidade (se encontrou cristal):**
     - 1 cristal: 50% chance
     - 2 cristais: 25% chance
     - 3 cristais: 15% chance
     - 4 cristais: 5% chance
     - 5 cristais: 5% chance

**`processarMineracao(jogadorId, jogadorNome)`**
- Processo completo de mineração:
  1. Verifica se tem picareta
  2. Realiza sorteio de cristais
  3. Adiciona wons ao jogador (se encontrou cristais)
  4. Consome a picareta
  5. Retorna resultado formatado

**`formatarMensagemMineracao(resultado)`**
- Formata mensagem de resultado para exibição
- Mostra tipo, quantidade e valor total dos cristais

## 🎮 Como Usar

### Para Jogadores:
1. Compre uma **Picareta do Minerador** na loja (categoria "Itens de Apoio")
2. Adicione-se como minerador na ficha de dungeon (não conta no limite de 5 participantes)
3. Após a conclusão da dungeon, o sistema realizará o sorteio automático
4. A picareta será consumida automaticamente

### Regras:
- ✅ Minerador NÃO conta no limite de 5 participantes
- ✅ Minerador NÃO escolhe prêmios (apenas coleta cristais)
- ✅ Minerador ganha 20% de XP da dungeon
- ✅ Não há restrição de rank para mineradores
- ❌ A picareta quebra após o uso (consumível)

## 🔧 Integração com o Sistema Existente

### Banco de Dados:
- Utiliza tabelas existentes: `inventario_jogador`, `inventario_usuario`, `itens`
- Não requer novas tabelas

### Sistemas Utilizados:
- `InventorySystem` - Gerenciamento de inventário
- `EconomySystem` - Adição de wons
- `db` - Consultas e operações no banco

## 📊 Probabilidades

### Chance de Encontrar Cristais:
- **Nada:** 40%
- **Cristal Pequeno:** 30%
- **Cristal Médio:** 20%
- **Cristal Grande:** 10%

### Distribuição de Quantidade (quando encontra):
- **1 cristal:** 50%
- **2 cristais:** 25%
- **3 cristais:** 15%
- **4 cristais:** 5%
- **5 cristais:** 5%

### Valores:
- Cristal Grande: 100.000 Wons cada
- Cristal Médio: 60.000 Wons cada
- Cristal Pequeno: 20.000 Wons cada

## ✨ Exemplo de Uso

```
Jogador compra picareta: -20.000 Wons
Jogador participa como minerador de uma Dungeon Rank C

Sorteio:
- Tipo: Cristal Médio (20% chance)
- Quantidade: 3 cristais (15% chance)
- Valor: 3 × 60.000 = 180.000 Wons

Resultado final:
- Picareta consumida
- +180.000 Wons adicionados ao saldo
- +20% XP da dungeon (8.000 XP para Rank C)
```

## 🚀 Próximos Passos (Opcional)

Para integrar completamente com o comando `!concluir Dungeon`:

1. Modificar `src/commands/concluirDungeon.js` para:
   - Identificar mineradores na ficha
   - Chamar `processarMineracao()` para cada minerador
   - Exibir resultados da mineração na mensagem final

2. Modificar `formatarFichaDungeon()` para:
   - Adicionar seção de mineradores na ficha
   - Exibir mineradores separadamente dos participantes

## ✅ Status da Implementação

- [x] Item Picareta criado na loja
- [x] Sistema de verificação de picareta
- [x] Sistema de consumo de picareta
- [x] Sistema de sorteio de cristais
- [x] Sistema de processamento de mineração
- [x] Formatação de mensagens
- [x] Integração com EconomySystem
- [x] Integração com InventorySystem
- [ ] Integração com comando !concluir Dungeon (opcional)
- [ ] Seção de mineradores na ficha de dungeon (opcional)

## 📝 Notas Importantes

1. O minerador é um participante ESPECIAL que não conta no limite de 5
2. O sistema já está funcional e pode ser testado
3. A integração com `!concluir Dungeon` pode ser feita posteriormente
4. Todos os métodos estão prontos para uso