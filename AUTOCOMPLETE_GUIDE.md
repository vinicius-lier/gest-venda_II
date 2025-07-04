# Guia do Autocomplete - Gestão Operacional de Vendas

## Visão Geral

O autocomplete foi adaptado para usar o tema de cores do projeto, mantendo a consistência visual e melhorando a experiência do usuário.

## Cores do Tema

O autocomplete usa as seguintes variáveis CSS do tema:

- `--primary-color: #2c3e50` (cinza grafite escuro)
- `--secondary-color: #e74c3c` (vermelho)
- `--accent-color: #34495e` (cinza grafite)
- `--light-color: #ecf0f1` (cinza claro)
- `--background-color: #ffffff` (fundo principal)
- `--text-color: #2c3e50` (texto principal)
- `--border-radius: 8px` (raio das bordas)
- `--transition: all 0.3s ease` (transições)

## Como Usar

### 1. Estrutura HTML

```html
<div class="autocomplete-container">
    <input type="text" 
           id="id_funcionario_text" 
           name="funcionario_text" 
           class="form-control" 
           placeholder="Digite o nome..."
           autocomplete="off">
    <input type="hidden" id="id_funcionario" name="funcionario">
</div>
```

### 2. JavaScript

```javascript
function setupFuncionarioAutocomplete() {
    const input = $('#id_funcionario_text');
    const hiddenInput = $('#id_funcionario');
    
    input.on('input', function() {
        const query = $(this).val().trim();
        
        if (query.length < 2) return;
        
        $.ajax({
            url: '/api/funcionarios/',
            data: { q: query },
            success: function(data) {
                showAutocomplete(data.results, input, hiddenInput);
            }
        });
    });
}
```

### 3. CSS

O CSS já está configurado no arquivo `core/static/core/css/autocomplete.css` e inclui:

- Estilos responsivos
- Animações suaves
- Estados de hover e seleção
- Botão "Adicionar novo" com ícone
- Suporte para autocomplete pequeno

## Características

### ✅ Funcionalidades

- **Navegação por teclado**: Setas para cima/baixo, Enter para selecionar, Esc para fechar
- **Busca em tempo real**: Ativa após 2 caracteres
- **Botão "Adicionar novo"**: Permite adicionar itens que não existem
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Tema consistente**: Usa as cores do projeto

### 🎨 Estilos

- **Fundo**: Branco com sombra suave
- **Texto**: Cor do tema principal
- **Hover**: Cor de fundo clara do tema
- **Seleção**: Cor de fundo do tema
- **Botão adicionar**: Cor secundária (vermelho) com ícone "+"

### 📱 Responsividade

- **Desktop**: Largura de 360px
- **Mobile**: Largura de 100% com máximo de 360px
- **Altura**: Máximo de 304px (115px para versão pequena)

## Exemplos de Uso

### Autocomplete Padrão

```html
<div class="autocomplete-container">
    <input type="text" class="form-control" placeholder="Buscar...">
    <input type="hidden" name="item_id">
</div>
```

### Autocomplete Pequeno

```html
<div class="autocomplete-container">
    <input type="text" class="form-control autocomplete-small" placeholder="Buscar...">
    <input type="hidden" name="item_id">
</div>
```

## API Esperada

O autocomplete espera que sua API retorne dados no formato:

```json
{
    "results": [
        {
            "id": 1,
            "nome": "Nome do Item",
            "outros_campos": "valores..."
        }
    ]
}
```

## Personalização

### Cores

Para alterar as cores, modifique as variáveis CSS no arquivo `style.css`:

```css
:root {
    --primary-color: #sua-cor;
    --secondary-color: #sua-cor;
    --light-color: #sua-cor;
}
```

### Tamanhos

Para alterar tamanhos, modifique no `autocomplete.css`:

```css
div.autocomplete {
    width: 400px; /* Largura personalizada */
    max-height: 400px; /* Altura máxima */
}
```

## Arquivos Relacionados

- `core/static/core/css/autocomplete.css` - Estilos do autocomplete
- `core/static/core/js/autocomplete_example.js` - Exemplo de implementação
- `core/templates/core/autocomplete_example.html` - Template de exemplo

## Compatibilidade

- ✅ Chrome/Edge (baseado em Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ✅ jQuery 3.x
- ✅ Bootstrap 5.x

## Troubleshooting

### Problema: Autocomplete não aparece
**Solução**: Verifique se o CSS está sendo carregado e se o container tem `position: relative`

### Problema: Cores não estão corretas
**Solução**: Verifique se as variáveis CSS estão definidas no `:root`

### Problema: Não funciona no mobile
**Solução**: Verifique se o z-index está correto e se não há elementos sobrepondo

## Contribuição

Para adicionar novas funcionalidades ou corrigir bugs:

1. Modifique o arquivo `autocomplete.css`
2. Teste em diferentes dispositivos
3. Mantenha a consistência com o tema
4. Documente as mudanças 