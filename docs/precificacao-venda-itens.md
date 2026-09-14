# Preços e venda de itens

Revisados 919 itens no PostgreSQL configurado. Preço positivo existente foi preservado. Nos 854 registros sem preço, recuperado valor confiável já definido ou estimado: 828 estimativas e 26 valores estabelecidos. Ao final nenhum item permaneceu sem preço positivo.

Estimativa usa a média de preço da loja para o mesmo rank e categoria/slot. Se não existe aquele tipo no rank, usa referências não materiais do mesmo rank. Inicial/Comum usam E; Raro D; Épico B; Lendário A; Único S. Tier não identificado usa E e fica registrado no relatório.

Com referência de atributos: preço = média × (0,5 + 0,5 × soma dos bônus / média dos bônus). Os seis atributos têm o mesmo peso. Valores maiores que a média valorizam o item proporcionalmente. Apoio sem atributos nas referências usa a média de combate daquele rank para valorizar atributos adicionais; apoio sem bônus mantém a média de preço. Nenhum atributo foi alterado.

Venda paga metade do preço, arredondada para baixo por unidade e multiplicada pela quantidade. Cristais de mineração mantêm seus valores de venda específicos. Itens equipados precisam ser desequipados. Proposta e confirmação usam a mesma função; preço alterado exige nova proposta.

Novos itens sem valor confiável também podem ser estimados na venda. A atualização do banco é feita por `node scripts/price-unvalued-items.js`. O relatório inicial `precos-itens-estimados.json` guarda IDs, valores anteriores, preço final, referências, atributos e fatores utilizados. Novas execuções geram arquivos com data/hora, preservando o relatório inicial.

Os testes cobrem preços estabelecidos, valor padrão indevido, rank/tipo, atributos altos, apoio com atributos, quantidade, concorrência e reversão. Não foram reembolsadas vendas antigas nesta atualização.
