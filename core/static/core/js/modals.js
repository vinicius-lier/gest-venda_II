/**
 * Gerenciamento de modais para o sistema de gestão operacional de vendas
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando configurações de modais...');
    
    // Função para inicializar os listeners de modais
    function initModals() {
        // Para cada modal no documento
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(function(modal) {
            // Criar instância de Modal do Bootstrap para cada modal
            const modalInstance = new bootstrap.Modal(modal);
            
            // Quando o modal é fechado, limpar os campos
            modal.addEventListener('hidden.bs.modal', function() {
                // Limpar formulários dentro do modal
                const forms = modal.querySelectorAll('form');
                forms.forEach(function(form) {
                    form.reset();
                });
                
                // Esconder mensagens de erro
                const errorMessages = modal.querySelectorAll('.error-message');
                errorMessages.forEach(function(errorMessage) {
                    errorMessage.style.display = 'none';
                });
            });
            
            // Quando o modal é aberto, focar no primeiro campo
            modal.addEventListener('shown.bs.modal', function() {
                const firstInput = modal.querySelector('input:not([type="hidden"])');
                if (firstInput) {
                    firstInput.focus();
                }
            });
        });
    }
    
    // Inicializar os modais
    initModals();
}); 