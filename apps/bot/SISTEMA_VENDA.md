# Sistema de Venda de Itens - Implementação Completa

## 📋 Resumo das Alterações

### 1. **Sistema de Venda** (`src/systems/vendaSystem.js`)
- Sistema completo de venda de itens para a loja
- Suporte a itens normais e minérios
- Cálculo automático de valores (50% para itens normais, valor cheio para minérios)
- Validações de segurança (não vende itens equipados)
- Tabela de vendas pendentes com expiração de 5 minutos

### 2. **Comando !vender** (`src/commands/vender.js`)
- Inicia o processo de venda de um item
- Mostra detalhes da venda (valor unitário, total, saldo atual)
- Armazena venda pendente no banco de dados
- Aguarda confirmação do jogador

### 3. **Comando !confirmar venda** (`src/commands/confirmarVenda.js`)
- Confirma a venda pendente
- Remove o item do inventário
- Adiciona Wons diretamente na conta do jogador
- Mostra saldo atualizado
- Valida se a venda não expirou (5 minutos)

### 4. **Comando !cancelar venda** (`src/commands/cancelarVenda.js`)
- Cancela uma venda pendente
- Remove o registro de venda pendente
- Item permanece no inventário

### 5. **Registro de Comandos** (`src/core/registroComandos.js`)
- Comandos registrados no sistema:
  - `!vender <item>` - Inicia venda
  - `!confirmar venda` - Confirma venda
  - `!cancelar venda` - Cancela venda

## 🎮 Como Usar

### Fluxo de Venda:

1. **Iniciar Venda:**
   ```
   !vender <nome do item>
   ```
   Exemplo: `!vender Espada`

2. **Verificar Informações:**
   - O bot mostra o item, quantidade, valor unitário e total
   - Mostra o saldo atual
   - Informações de confirmação

3. **Confirmar ou Cancelar:**
   ```
   !confirmar venda  (para confirmar)
   !cancelar venda   (para cancelar)
   ```

4. **Resultado:**
   - Venda confirmada: Item removido, Wons adicionados
   - Venda cancelada: Item permanece no inventário

## 💰 Sistema de Preços

### Itens Normais (Armas, Armaduras, Acessórios, Consumíveis):
- **Valor de venda:** 50% do preço original da loja
- Exemplo: Item de 100.000 Wons = Vende por 50.000 Wons

### Minérios (Sistema de Mineração):
- **Valor de venda:** 100% do valor do sistema de mineração
- Cristal Grande: 100.000 Wons
- Cristal Médio: 60.000 Wons
- Cristal Pequeno: 20.000 Wons

## ✅ Regras de Venda

1. **Itens não vendáveis:**
   - ❌ Itens equipados (desequipe primeiro)
   - ❌ Itens sem preço definido
   - ❌ Itens que não existem na loja ou não são minérios

2. **Validações:**
   - Verifica se o jogador tem o item
   - Verifica se tem quantidade suficiente
   - Verifica se não está equipado
   - Verifica se o item é vendável

3. **Expiração:**
   - Vendas pendentes expiram em 5 minutos
   - Após expiração, é necessário iniciar nova venda

## 🔧 Integração com Sistemas

### Banco de Dados:
- Tabela `vendas_pendentes` criada automaticamente
- Campos: id, jogador_id, item_nome, quantidade, valor_total, tipo, data

### Sistemas Utilizados:
- `VendaSystem` - Lógica de venda
- `EconomySystem` - Adição de Wons
- `InventorySystem` - Remoção de itens
- `db` - Consultas e operações

## 📊 Exemplos de Uso

### Exemplo 1: Venda de Item Normal
```
Jogador: !vender Espada do Aspirante

Bot: ═══ CONFIRMAÇÃO DE VENDA ═══
Item: Espada do Aspirante
Quantidade: 1
Valor unitário: 50.000 Wons (50% de 100.000)
Valor total: 50.000 Wons
Saldo atual: 150.000 Wons

Use !confirmar venda para confirmar
Use !cancelar venda para cancelar

Jogador: !confirmar venda

Bot: ═══ VENDA CONCLUÍDA ✅ ═══
Item vendido: 1x Espada do Aspirante
Valor recebido: 50.000 Wons
Novo saldo: 200.000 Wons
```

### Exemplo 2: Venda de Minério
```
Jogador: !vender Cristal Grande

Bot: ═══ CONFIRMAÇÃO DE VENDA ═══
Minério: Cristal Grande
Quantidade: 1
Valor unitário: 100.000 Wons (valor cheio)
Valor total: 100.000 Wons
Saldo atual: 50.000 Wons

Use !confirmar venda para confirmar

Jogador: !confirmar venda

Bot: ═══ VENDA CONCLUÍDA ✅ ═══
Minério vendido: 1x Cristal Grande
Valor recebido: 100.000 Wons
Novo saldo: 150.000 Wons
```

### Exemplo 3: Venda Cancelada
```
Jogador: !vender Poção

Bot: ═══ CONFIRMAÇÃO DE VENDA ═══
Item: Poção do Aspirante
Quantidade: 3
Valor unitário: 50.000 Wons
Valor total: 150.000 Wons

Jogador: !cancelar venda

Bot: ═══ VENDA CANCELADA ✅ ═══
Venda cancelada: 3x Poção do Aspirante
O item permanece no seu inventário.
```

## ⚠️ Tratamento de Erros

### Item não encontrado:
```
❌ Item não encontrado
O item "X" não foi encontrado no seu inventário.
Dica: Use !inventario para ver seus itens.
```

### Item equipado:
```
❌ Erro na venda
Não pode vender Espada do Aspirante enquanto estiver equipado.
Desequipe primeiro.
```

### Quantidade insuficiente:
```
❌ Erro na venda
Você tem apenas 1x Poção do Aspirante.
```

### Venda expirada:
```
❌ Venda expirada
A venda de 1x Espada do Aspirante expirou.
Inicie uma nova venda com !vender <item>.
```

## 📝 Notas Importantes

1. **Sistema de Confirmação:**
   - Todas as vendas requerem confirmação explícita
   - O jogador pode cancelar a qualquer momento antes de confirmar
   - A venda pendente é armazenada no banco de dados

2. **Segurança:**
   - Não é possível vender itens equipados
   - Validação de quantidade antes da venda
   - Verificação de existência do item no inventário

3. **Minérios:**
   - Vendem pelo valor cheio (sem desconto de 50%)
   - Valores definidos pelo sistema de mineração
   - Identificados automaticamente pelo nome

4. **Transações:**
   - Todas as vendas são registradas no banco
   - Histórico de transações mantido
  - Saldo atualizado automaticamente

## ✅ Status da Implementação

- [x] Sistema de venda criado
- [x] Comando !vender implementado
- [x] Comando !confirmar venda implementado
- [x] Comando !cancelar venda implementado
- [x] Lógica de 50% de retorno para itens normais
- [x] Sistema de valores de minérios
- [x] Validações de segurança
- [x] Sistema de vendas pendentes com expiração
- [x] Integração com EconomySystem
- [x] Integração com InventorySystem
- [x] Comandos registrados no sistema
- [x] Documentação completa

## 🚀 Funcionalidades Extras

- ✅ Suporte a múltiplas quantidades
- ✅ Identificação automática de minérios
- ✅ Mensagens formatadas e detalhadas
- ✅ Sistema de expiração de vendas pendentes
- ✅ Validações completas de segurança
- ✅ Integração total com sistemas existentes
- ✅ Histórico de transações

O sistema está completo e funcional!