/**
 * autocomplete.js
 * Script para gerenciar os campos de autocomplete no sistema
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa todos os campos de autocomplete
    initAutocomplete();
});

/**
 * Inicializa os campos de autocomplete
 */
function initAutocomplete() {
    // Inicializa autocomplete de clientes
    const clienteFields = document.querySelectorAll('.cliente-autocomplete');
    clienteFields.forEach(field => {
        setupAutocomplete(field, 'cliente');
    });
    
    // Inicializa autocomplete de motos
    const motoFields = document.querySelectorAll('.moto-autocomplete');
    motoFields.forEach(field => {
        setupAutocomplete(field, 'moto');
    });
}

/**
 * Configura o autocomplete para um campo específico
 * @param {HTMLElement} field - Campo de entrada
 * @param {string} type - Tipo de autocomplete (cliente, moto)
 */
function setupAutocomplete(field, type) {
    const container = field.closest('.autocomplete-container');
    const results = container.querySelector('.autocomplete-results');
    const hiddenField = container.querySelector(`input[name="${field.name}_id"]`);
    
    // Evento de digitação
    field.addEventListener('input', debounce(function() {
        const query = field.value.trim();
        
        if (query.length < 2) {
            results.innerHTML = '';
            results.classList.remove('show');
            return;
        }
        
        // Mostra indicador de carregamento
        results.innerHTML = '<div class="autocomplete-loading"><i class="fas fa-spinner"></i> Buscando...</div>';
        results.classList.add('show');
        
        // Faz a busca na API
        searchItems(type, query)
            .then(items => {
                renderResults(results, items, type);
            })
            .catch(error => {
                results.innerHTML = `<div class="autocomplete-message">Erro ao buscar: ${error.message}</div>`;
            });
    }, 300));
    
    // Evento de foco
    field.addEventListener('focus', function() {
        if (field.value.trim().length >= 2) {
            results.classList.add('show');
        }
    });
    
    // Evento de clique fora
    document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
            results.classList.remove('show');
        }
    });
    
    // Evento de teclas
    field.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            results.classList.remove('show');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateResults(results, 'down');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateResults(results, 'up');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const active = results.querySelector('.autocomplete-item.active');
            if (active) {
                active.click();
            }
        }
    });
    
    // Botão de cadastro rápido
    const btnNovoItem = container.querySelector(type === 'cliente' ? '.btn-novo-cliente' : '.btn-nova-moto');
    if (btnNovoItem) {
        btnNovoItem.addEventListener('click', function() {
            openQuickAddModal(type);
        });
    }
}

/**
 * Busca itens na API
 * @param {string} type - Tipo de item (cliente, moto)
 * @param {string} query - Texto de busca
 * @returns {Promise<Array>} - Promessa com os resultados
 */
function searchItems(type, query) {
    const endpoint = type === 'cliente' 
        ? '/api/buscar-clientes/?q=' + encodeURIComponent(query)
        : '/api/buscar-motos/?q=' + encodeURIComponent(query);
    
    return fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na busca');
            }
            return response.json();
        })
        .then(data => data.results || []);
}

/**
 * Renderiza os resultados da busca
 * @param {HTMLElement} container - Elemento para mostrar resultados
 * @param {Array} items - Itens encontrados
 * @param {string} type - Tipo de item (cliente, moto)
 */
function renderResults(container, items, type) {
    container.innerHTML = '';
    
    if (!items.length) {
        container.innerHTML = `<div class="autocomplete-message">
            Nenhum ${type === 'cliente' ? 'cliente' : 'moto'} encontrado
        </div>`;
        return;
    }
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.dataset.id = item.id;
        
        if (type === 'cliente') {
            div.innerHTML = `
                <strong>${item.nome}</strong>
                <span class="item-info">
                    ${item.cpf ? 'CPF: ' + item.cpf : ''} 
                    ${item.telefone ? ' | Tel: ' + item.telefone : ''}
                </span>
            `;
        } else {
            div.innerHTML = `
                <strong>${item.marca} ${item.modelo} (${item.ano})</strong>
                <span class="item-info">
                    Cor: ${item.cor} 
                    ${item.placa ? ' | Placa: ' + item.placa : ''}
                    ${item.matricula ? ' | Matrícula: ' + item.matricula : ''}
                </span>
            `;
        }
        
        div.addEventListener('click', function() {
            selectItem(this, type);
        });
        
        container.appendChild(div);
    });
}

/**
 * Seleciona um item do autocomplete
 * @param {HTMLElement} element - Elemento selecionado
 * @param {string} type - Tipo de item
 */
function selectItem(element, type) {
    const container = element.closest('.autocomplete-container');
    const inputField = container.querySelector('.autocomplete-field');
    const hiddenField = container.querySelector(`input[name="${inputField.name}_id"]`);
    const id = element.dataset.id;
    
    // Define valores
    if (hiddenField) hiddenField.value = id;
    inputField.value = element.querySelector('strong').textContent;
    
    // Esconde resultados
    const results = container.querySelector('.autocomplete-results');
    results.classList.remove('show');
    
    // Dispara evento de mudança
    const event = new Event('change', { bubbles: true });
    inputField.dispatchEvent(event);
    
    // Se for um campo de formulário, busca e preenche dados adicionais
    if (type === 'cliente') {
        fillClienteDetails(id);
    } else if (type === 'moto') {
        fillMotoDetails(id);
    }
}

/**
 * Navega entre os resultados com teclado
 * @param {HTMLElement} container - Container de resultados
 * @param {string} direction - Direção (up/down)
 */
function navigateResults(container, direction) {
    const items = container.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    
    const active = container.querySelector('.autocomplete-item.active');
    let index = -1;
    
    if (active) {
        active.classList.remove('active');
        index = Array.from(items).indexOf(active);
    }
    
    if (direction === 'down') {
        index = (index + 1) % items.length;
    } else {
        index = index <= 0 ? items.length - 1 : index - 1;
    }
    
    items[index].classList.add('active');
    items[index].scrollIntoView({ block: 'nearest' });
}

/**
 * Preenche detalhes do cliente selecionado
 * @param {number} id - ID do cliente
 */
function fillClienteDetails(id) {
    // Esta função será implementada de acordo com a necessidade do formulário
    console.log('Buscando detalhes do cliente ID:', id);
}

/**
 * Preenche detalhes da moto selecionada
 * @param {number} id - ID da moto
 */
function fillMotoDetails(id) {
    // Esta função será implementada de acordo com a necessidade do formulário
    console.log('Buscando detalhes da moto ID:', id);
}

/**
 * Abre modal para cadastro rápido
 * @param {string} type - Tipo de cadastro (cliente, moto)
 */
function openQuickAddModal(type) {
    const modalId = type === 'cliente' ? 'modalNovoCliente' : 'modalNovaMoto';
    const modal = document.getElementById(modalId);
    
    if (modal) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Configura o formulário de cadastro rápido
        setupQuickAddForm(type, modal);
    }
}

/**
 * Configura o formulário de cadastro rápido
 * @param {string} type - Tipo de cadastro
 * @param {HTMLElement} modal - Elemento do modal
 */
function setupQuickAddForm(type, modal) {
    const form = modal.querySelector('form');
    const btnSalvar = modal.querySelector(type === 'cliente' ? '#btnSalvarNovoCliente' : '#btnSalvarNovaMoto');
    
    if (!form || !btnSalvar) return;
    
    btnSalvar.addEventListener('click', function() {
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            // Remove "novo" do início dos nomes dos campos
            const fieldName = key.replace(/^novo(Cliente|Moto)/, '').toLowerCase();
            data[fieldName] = value;
        });
        
        // Salva dados via API
        saveQuickAdd(type, data)
            .then(response => {
                if (response.success) {
                    // Fecha o modal
                    bootstrap.Modal.getInstance(modal).hide();
                    
                    // Atualiza o campo de autocomplete
                    updateFieldAfterQuickAdd(type, response.item);
                    
                    // Mostra mensagem de sucesso
                    showToast(`${type === 'cliente' ? 'Cliente' : 'Moto'} cadastrado com sucesso!`);
                } else {
                    showToast(`Erro: ${response.message}`, 'error');
                }
            })
            .catch(error => {
                showToast(`Erro ao salvar: ${error.message}`, 'error');
            });
    });
}

/**
 * Salva cadastro rápido via API
 * @param {string} type - Tipo de cadastro
 * @param {Object} data - Dados do formulário
 * @returns {Promise<Object>} - Promessa com resposta
 */
function saveQuickAdd(type, data) {
    const endpoint = type === 'cliente' ? '/api/clientes/' : '/api/motos/';
    
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao salvar');
        }
        return response.json();
    });
}

/**
 * Atualiza campo após cadastro rápido
 * @param {string} type - Tipo de cadastro
 * @param {Object} item - Item cadastrado
 */
function updateFieldAfterQuickAdd(type, item) {
    const field = document.querySelector(`.${type}-autocomplete:focus`);
    if (!field) return;
    
    const container = field.closest('.autocomplete-container');
    const hiddenField = container.querySelector(`input[name="${field.name}_id"]`);
    
    if (hiddenField) {
        hiddenField.value = item.id;
    }
    
    if (type === 'cliente') {
        field.value = item.nome;
    } else {
        field.value = `${item.marca} ${item.modelo} (${item.ano}) - ${item.cor}`;
    }
    
    // Dispara evento de mudança
    const event = new Event('change', { bubbles: true });
    field.dispatchEvent(event);
}

/**
 * Obtém o token CSRF da página
 * @returns {string} - Token CSRF
 */
function getCsrfToken() {
    const tokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
    return tokenElement ? tokenElement.value : '';
}

/**
 * Função de debounce para evitar múltiplas requisições
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
} 