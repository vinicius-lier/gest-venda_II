# TODO - Formulário de Ocorrência

## Problemas Identificados
- [ ] Formulário de ocorrência não está funcionando corretamente
- [ ] Possível problema com o campo `solicitante` (vinculação com `usuario_sistema`)
- [ ] Verificar se há outros campos com problemas de validação

## Tarefas para Amanhã

### 1. Investigação Inicial
- [ ] Testar o formulário de ocorrência localmente
- [ ] Verificar logs do Heroku para identificar erros específicos
- [ ] Analisar se o problema é no frontend ou backend

### 2. Verificação de Modelos e Relacionamentos
- [ ] Revisar modelo `Ocorrencia` e seus campos
- [ ] Verificar relacionamento entre `User` e `Usuario` (usuario_sistema)
- [ ] Confirmar se todos os campos obrigatórios estão sendo validados corretamente

### 3. Correção do Formulário
- [ ] Revisar `OcorrenciaForm` em `forms.py`
- [ ] Verificar se há problemas de validação
- [ ] Testar criação de ocorrência com dados válidos
- [ ] Corrigir qualquer problema identificado

### 4. Testes e Validação
- [ ] Testar formulário após correções
- [ ] Verificar se mensagens de erro estão sendo exibidas corretamente
- [ ] Confirmar que ocorrências estão sendo salvas no banco
- [ ] Testar no ambiente de produção (Heroku)

### 5. Documentação
- [ ] Atualizar documentação se necessário
- [ ] Registrar soluções implementadas

## Status Atual
- Proteção adicionada para usuários sem `usuario_sistema`
- Deploy realizado no Heroku
- Formulário ainda com problemas não identificados

## Próximos Passos
1. Investigar erro específico do formulário
2. Corrigir problema identificado
3. Testar funcionalidade completa
4. Deploy das correções 