# Fase 14 — Cardinal Web Research & External Inspiration Engine

Status: implementação base concluída e verificada.

1. **Arquitetura:** `cardinal/web/index.js` reúne planner, política, fetch controlado, ranking, extração, cache e adaptação.
2. **Ferramentas:** pesquisa é fornecida por adapter controlado; fetch HTTPS tem allowlist, timeout, limite de conteúdo, redirecionamento recusado e máximo de páginas.
3. **Segurança:** bloqueia localhost/rede privada, esquemas não HTTPS e domínios fora da política; scripts/estilos são removidos e conteúdo web é tratado como dado, não instrução.
4. **Intenções:** classifica armas, skills, mitos, locais reais, sistemas, bosses e desconhecidos; o plano define consultas, campos e modo.
5. **Fontes/ranking:** identifica Wikipedia, wiki de franquia, oficial e desconhecida; registra score, título, URL, tipo e data de acesso.
6. **Extração:** produz facts de identidade, aparência, habilidades, temas e limitações; traços recebem prioridade CORE/SECONDARY.
7. **Record externo:** persiste query, plano, fatos, citações, confiança, traits e log de adaptação em SQLite com TTL.
8. **Cache/refresh:** consultas repetidas reutilizam record válido; `refresh` força nova pesquisa.
9. **Inspiração:** transforma arma externa em proposta de arma RPG, mito em boss/quest e demais referências em tema; por padrão é `INSPIRED_ADAPTATION`, sem copiar mecânicas.
10. **Review:** “mostre só a pesquisa” resulta em `READ_ONLY_RESEARCH`/`FACT_SHEET`, sem criar draft.
11. **Integrações:** o record contém facts e adaptation plan próprios para Forge/Narrative/World/Balance; esses módulos continuam sendo os validadores finais.
12. **Configuração:** `.env.example` inclui `CARDINAL_WEB_ENABLED=false`, timeout, fetches e TTL seguros; a web fica desabilitada por padrão.
13. **Guia:** `CARDINAL_WEB_RESEARCH_GUIDE.md` documenta fontes, limites, adaptação e segurança.
14. **Testes:** plano de Shikai/arma, merge de duas fontes, cache, review, bloqueio SSRF, remoção de script/prompt injection e offline controlado.

Limitações: não há provedor de busca externo habilitado por padrão; o projeto exige injetar/configurar um adapter de busca aprovado antes de ativar a web. Não há scraping irrestrito, execução de conteúdo remoto, publicação automática ou cópia extensa. Integração UI completa e permissões granulares seguem para uma etapa de painel/autorização, após definição de provedores aprovados. A Fase 15 não foi iniciada.
