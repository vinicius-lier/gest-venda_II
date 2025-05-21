/**
 * scripts.js
 * Funções gerais para o sistema
 */

// Inicializa componentes ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    initComponents();
    setupDataTables();
    setupAdvancedSearch();
    setupConfirmations();
    setupDatePickers();
    setupCurrencyInputs();
});

/**
 * Inicializa componentes Bootstrap
 */
function initComponents() {
    // Inicializa tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializa popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

/**
 * Configura tabelas com DataTables
 */
function setupDataTables() {
    const tables = document.querySelectorAll('.datatable');
    if (!tables.length) return;

    // Verifica se o DataTables está disponível
    if (typeof $.fn.DataTable !== 'function') {
        console.warn('DataTables não está disponível');
        return;
    }

    // Configuração padrão para DataTables em português
    const defaultOptions = {
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json'
        },
        responsive: true,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
        columnDefs: [
            { orderable: false, targets: 'no-sort' },
            { searchable: false, targets: 'no-search' }
        ]
    };

    // Inicializa cada tabela
    tables.forEach(table => {
        const options = { ...defaultOptions };
        
        // Opções específicas via data attributes
        if (table.dataset.pageLength) {
            options.pageLength = parseInt(table.dataset.pageLength);
        }
        
        // Inicializa DataTable
        $(table).DataTable(options);
    });
}

/**
 * Configura buscas avançadas
 */
function setupAdvancedSearch() {
    const toggleButtons = document.querySelectorAll('.toggle-advanced-search');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = document.querySelector(this.dataset.target);
            if (!target) return;
            
            // Alterna visibilidade do painel
            target.classList.toggle('show');
            
            // Alterna ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-angle-down');
                icon.classList.toggle('fa-angle-up');
            }
        });
    });

    // Limpar filtros
    const clearButtons = document.querySelectorAll('.clear-search');
    clearButtons.forEach(button => {
        button.addEventListener('click', function() {
            const form = this.closest('form');
            if (!form) return;
            
            // Limpa todos os campos
            form.querySelectorAll('input, select').forEach(field => {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
            });
            
            // Envia o formulário
            form.submit();
        });
    });
}

/**
 * Configura confirmações de ações
 */
function setupConfirmations() {
    const confirmButtons = document.querySelectorAll('[data-confirm]');
    confirmButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const message = this.dataset.confirm || 'Confirma esta ação?';
            
            e.preventDefault();
            
            // Usa SweetAlert2 se disponível, ou a confirmação nativa
            if (typeof Swal === 'function') {
                Swal.fire({
                    title: 'Confirmação',
                    text: message,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sim',
                    cancelButtonText: 'Não',
                    reverseButtons: true
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Se for um link
                        if (this.tagName === 'A') {
                            window.location.href = this.href;
                        } 
                        // Se for um botão em um formulário
                        else if (this.form) {
                            this.form.submit();
                        }
                    }
                });
            } else {
                if (confirm(message)) {
                    // Se for um link
                    if (this.tagName === 'A') {
                        window.location.href = this.href;
                    } 
                    // Se for um botão em um formulário
                    else if (this.form) {
                        this.form.submit();
                    }
                }
            }
        });
    });
}

/**
 * Configura seletores de data
 */
function setupDatePickers() {
    const dateFields = document.querySelectorAll('.datepicker');
    if (!dateFields.length) return;

    // Se for usar uma biblioteca como o Flatpickr
    if (typeof flatpickr === 'function') {
        flatpickr(dateFields, {
            dateFormat: 'd/m/Y',
            locale: 'pt',
            allowInput: true
        });
    }
}

/**
 * Configura campos de moeda
 */
function setupCurrencyInputs() {
    const currencyFields = document.querySelectorAll('.currency-input');
    currencyFields.forEach(field => {
        field.addEventListener('input', function() {
            formatCurrency(this);
        });
        
        // Formata valor inicial
        if (field.value) {
            formatCurrency(field);
        }
    });
}

/**
 * Formata um valor como moeda
 * @param {HTMLElement} field - Campo a formatar
 */
function formatCurrency(field) {
    let value = field.value.replace(/\D/g, '');
    
    // Converte para valor decimal (divide por 100)
    value = (parseInt(value) / 100).toFixed(2);
    
    // Formata com separadores para BR
    value = value.replace('.', ',');
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    
    field.value = 'R$ ' + value;
}

/**
 * Mostra uma mensagem toast
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo da mensagem (success, error, warning, info)
 */
function showToast(message, type = 'success') {
    // Se SweetAlert2 estiver disponível
    if (typeof Swal === 'function') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: type,
            title: message
        });
    } 
    // Caso contrário, usa um alerta simples
    else {
        alert(message);
    }
}

/**
 * Formata uma data no padrão brasileiro
 * @param {Date|string} date - Data a formatar
 * @returns {string} - Data formatada
 */
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return '';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Função de debounce para evitar múltiplas chamadas
 * @param {Function} func - Função a executar
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