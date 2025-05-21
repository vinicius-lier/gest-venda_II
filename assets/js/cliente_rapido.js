/**
 * cliente_rapido.js
 * Script para gerenciar o cadastro rápido de clientes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o cadastro rápido de clientes
    initClienteRapido();
});

/**
 * Inicializa o cadastro rápido de clientes
 */
function initClienteRapido() {
    // Seleciona todos os formulários de cadastro rápido
    const forms = document.querySelectorAll('#formNovoCliente');
    forms.forEach(form => {
        setupClienteRapidoForm(form);
    });
    
    // Adiciona validação aos campos CPF e Telefone
    const cpfFields = document.querySelectorAll('#novoClienteCPF');
    cpfFields.forEach(field => {
        field.addEventListener('input', function() {
            formatCPF(this);
        });
    });
    
    const telFields = document.querySelectorAll('#novoClienteTelefone');
    telFields.forEach(field => {
        field.addEventListener('input', function() {
            formatTelefone(this);
        });
    });
    
    // Configura botões de salvar
    const saveButtons = document.querySelectorAll('#btnSalvarNovoCliente');
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const form = this.closest('.modal').querySelector('form');
            if (validateClienteForm(form)) {
                saveClienteRapido(form);
            }
        });
    });
}

/**
 * Configura o formulário de cadastro rápido
 * @param {HTMLElement} form - Formulário
 */
function setupClienteRapidoForm(form) {
    if (!form) return;
    
    // Limpa o formulário quando o modal for aberto
    const modal = form.closest('.modal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            form.reset();
            
            // Limpa feedbacks de validação
            form.querySelectorAll('.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });
            
            form.querySelectorAll('.invalid-feedback').forEach(feedback => {
                feedback.remove();
            });
            
            // Foca no campo de nome
            setTimeout(() => {
                form.querySelector('#novoClienteNome').focus();
            }, 500);
        });
    }
    
    // Configura tecla Enter para avançar nos campos
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // Encontra o próximo campo
                const fields = Array.from(form.querySelectorAll('input'));
                const index = fields.indexOf(this);
                
                if (index < fields.length - 1) {
                    // Vai para o próximo campo
                    fields[index + 1].focus();
                } else {
                    // Último campo, clica no botão de salvar
                    form.closest('.modal').querySelector('#btnSalvarNovoCliente').click();
                }
            }
        });
    });
}

/**
 * Valida o formulário de cliente
 * @param {HTMLElement} form - Formulário a validar
 * @returns {boolean} - Se o formulário é válido
 */
function validateClienteForm(form) {
    let isValid = true;
    
    // Remove validações anteriores
    form.querySelectorAll('.is-invalid').forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    form.querySelectorAll('.invalid-feedback').forEach(feedback => {
        feedback.remove();
    });
    
    // Valida campo nome (obrigatório)
    const nomeField = form.querySelector('#novoClienteNome');
    if (!nomeField.value.trim()) {
        addFieldError(nomeField, 'Nome é obrigatório');
        isValid = false;
    }
    
    // Valida CPF se preenchido
    const cpfField = form.querySelector('#novoClienteCPF');
    if (cpfField.value.trim() && !validateCPF(cpfField.value)) {
        addFieldError(cpfField, 'CPF inválido');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Adiciona mensagem de erro a um campo
 * @param {HTMLElement} field - Campo com erro
 * @param {string} message - Mensagem de erro
 */
function addFieldError(field, message) {
    field.classList.add('is-invalid');
    
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    
    field.parentNode.appendChild(feedback);
}

/**
 * Salva um cliente via API
 * @param {HTMLElement} form - Formulário de cliente
 */
function saveClienteRapido(form) {
    // Obtém dados do formulário
    const nome = form.querySelector('#novoClienteNome').value;
    const telefone = form.querySelector('#novoClienteTelefone').value;
    const cpf = form.querySelector('#novoClienteCPF').value;
    
    // Prepara dados para envio
    const data = {
        nome: nome,
        telefone: telefone,
        cpf: cpf,
        tipo: 'CLIENTE' // Tipo padrão para cadastro rápido
    };
    
    // Mostra indicador de carregamento
    const saveButton = form.closest('.modal').querySelector('#btnSalvarNovoCliente');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    saveButton.disabled = true;
    
    // Envia para a API
    fetch('/api/clientes/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Erro ao cadastrar cliente');
            });
        }
        return response.json();
    })
    .then(data => {
        // Fecha o modal
        const modal = form.closest('.modal');
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
        
        // Seleciona o cliente no campo de autocomplete
        const field = document.querySelector('.cliente-autocomplete:focus') || 
                     document.querySelector('.cliente-autocomplete');
                     
        if (field) {
            const container = field.closest('.autocomplete-container');
            const hiddenField = container.querySelector('input[name$="_id"]');
            
            field.value = data.nome;
            if (hiddenField) {
                hiddenField.value = data.id;
            }
            
            // Dispara evento de change
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Mostra mensagem de sucesso
        showToast('Cliente cadastrado com sucesso!');
    })
    .catch(error => {
        console.error('Erro:', error);
        showToast(error.message, 'error');
    })
    .finally(() => {
        // Restaura botão
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    });
}

/**
 * Formata um campo CPF
 * @param {HTMLElement} field - Campo de CPF
 */
function formatCPF(field) {
    let value = field.value.replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substr(0, 11);
    }
    
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }
    
    field.value = value;
}

/**
 * Formata um campo de telefone
 * @param {HTMLElement} field - Campo de telefone
 */
function formatTelefone(field) {
    let value = field.value.replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substr(0, 11);
    }
    
    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{4})(\d{1,4})$/, "($1) $2-$3");
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{1,4})$/, "($1) $2");
    }
    
    field.value = value;
}

/**
 * Valida um CPF
 * @param {string} cpf - CPF a validar
 * @returns {boolean} - Se o CPF é válido
 */
function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
        return false;
    }
    
    // Verifica CPFs com todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    if (rest === 10 || rest === 11) {
        rest = 0;
    }
    if (rest !== parseInt(cpf.charAt(9))) {
        return false;
    }
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rest = 11 - (sum % 11);
    if (rest === 10 || rest === 11) {
        rest = 0;
    }
    if (rest !== parseInt(cpf.charAt(10))) {
        return false;
    }
    
    return true;
}

/**
 * Obtém o token CSRF
 * @returns {string} - Token CSRF
 */
function getCsrfToken() {
    const tokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
    return tokenElement ? tokenElement.value : '';
} 