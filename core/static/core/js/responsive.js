/**
 * Responsividade e Interações para o Sistema de Gestão Operacional
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // GERENCIAMENTO DO SIDEBAR RESPONSIVO
    // ========================================
    
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const body = document.body;
    
    // Função para fechar o sidebar
    function closeSidebar() {
        sidebar.classList.remove('show');
        sidebarOverlay.classList.remove('show');
        body.classList.remove('sidebar-open');
        document.documentElement.style.overflow = '';
    }
    
    // Função para abrir o sidebar
    function openSidebar() {
        sidebar.classList.add('show');
        sidebarOverlay.classList.add('show');
        body.classList.add('sidebar-open');
        if (window.innerWidth <= 991) {
            document.documentElement.style.overflow = 'hidden';
        }
    }
    
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (sidebar.classList.contains('show')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking on a link (mobile)
    const sidebarLinks = sidebar.querySelectorAll('.nav-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 991) {
                closeSidebar();
            }
        });
    });
    
    // Add keyboard support (ESC key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && window.innerWidth <= 991) {
            closeSidebar();
        }
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 991) {
                closeSidebar();
            }
        }, 250);
    });
    
    // ========================================
    // MELHORIAS PARA TABELAS RESPONSIVAS
    // ========================================
    
    // Adicionar classes responsivas às tabelas
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
        if (!table.closest('.table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
    
    // Ocultar colunas menos importantes em mobile
    function hideMobileColumns() {
        const tables = document.querySelectorAll('.table-responsive .table');
        tables.forEach(table => {
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                const cells = table.querySelectorAll(`td:nth-child(${index + 1})`);
                const headerText = header.textContent.toLowerCase();
                
                // Lista de colunas que podem ser ocultadas em mobile
                const mobileHiddenColumns = [
                    'observações', 'observacoes', 'obs', 'notas', 'comentários', 'comentarios',
                    'descrição', 'descricao', 'detalhes', 'info', 'informações', 'informacoes',
                    'criado', 'atualizado', 'modificado', 'data criação', 'data criacao'
                ];
                
                if (mobileHiddenColumns.some(col => headerText.includes(col))) {
                    header.classList.add('d-none-mobile');
                    cells.forEach(cell => cell.classList.add('d-none-mobile'));
                }
            });
        });
    }
    
    // Executar na inicialização e no resize
    hideMobileColumns();
    window.addEventListener('resize', hideMobileColumns);
    
    // ========================================
    // MELHORIAS PARA FORMULÁRIOS RESPONSIVOS
    // ========================================
    
    // Ajustar layout de formulários em mobile
    function adjustFormLayout() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formGroups = form.querySelectorAll('.form-group, .mb-3');
            formGroups.forEach(group => {
                const inputs = group.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (window.innerWidth <= 767) {
                        input.classList.add('form-control-lg');
                    } else {
                        input.classList.remove('form-control-lg');
                    }
                });
            });
        });
    }
    
    // Executar na inicialização e no resize
    adjustFormLayout();
    window.addEventListener('resize', adjustFormLayout);
    
    // ========================================
    // MELHORIAS PARA MODAIS RESPONSIVOS
    // ========================================
    
    // Ajustar modais para mobile
    function adjustModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog && window.innerWidth <= 575) {
                dialog.classList.add('modal-fullscreen-sm-down');
            } else if (dialog) {
                dialog.classList.remove('modal-fullscreen-sm-down');
            }
        });
    }
    
    // Executar na inicialização e no resize
    adjustModals();
    window.addEventListener('resize', adjustModals);
    
    // ========================================
    // MELHORIAS PARA DROPDOWNS RESPONSIVOS
    // ========================================
    
    // Ajustar dropdowns para mobile
    function adjustDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(dropdown => {
            if (window.innerWidth <= 575) {
                dropdown.style.position = 'fixed';
                dropdown.style.top = '50%';
                dropdown.style.left = '50%';
                dropdown.style.transform = 'translate(-50%, -50%)';
                dropdown.style.width = '90%';
                dropdown.style.maxWidth = '300px';
                dropdown.style.margin = '0';
                dropdown.style.borderRadius = '0.5rem';
                dropdown.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
            } else {
                dropdown.style.position = '';
                dropdown.style.top = '';
                dropdown.style.left = '';
                dropdown.style.transform = '';
                dropdown.style.width = '';
                dropdown.style.maxWidth = '';
                dropdown.style.margin = '';
                dropdown.style.borderRadius = '';
                dropdown.style.boxShadow = '';
            }
        });
    }
    
    // Executar na inicialização e no resize
    adjustDropdowns();
    window.addEventListener('resize', adjustDropdowns);
    
    // ========================================
    // MELHORIAS PARA CARDS RESPONSIVOS
    // ========================================
    
    // Ajustar cards para diferentes tamanhos de tela
    function adjustCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (window.innerWidth <= 575) {
                card.classList.add('card-compact');
            } else {
                card.classList.remove('card-compact');
            }
        });
    }
    
    // Executar na inicialização e no resize
    adjustCards();
    window.addEventListener('resize', adjustCards);
    
    // ========================================
    // MELHORIAS PARA NAVEGAÇÃO RESPONSIVA
    // ========================================
    
    // Marcar link ativo baseado na URL atual
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && (href === currentPath || currentPath.startsWith(href))) {
                link.classList.add('active');
            }
        });
    }
    
    // Executar na inicialização
    setActiveNavLink();
    
    // ========================================
    // MELHORIAS PARA ACESSIBILIDADE
    // ========================================
    
    // Adicionar suporte para navegação por teclado
    document.addEventListener('keydown', function(e) {
        // Navegação por Tab no sidebar
        if (e.key === 'Tab' && sidebar.classList.contains('show')) {
            const focusableElements = sidebar.querySelectorAll(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
    
    // ========================================
    // MELHORIAS PARA PERFORMANCE
    // ========================================
    
    // Debounce para eventos de resize
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Aplicar debounce aos eventos de resize
    const debouncedResize = debounce(function() {
        adjustFormLayout();
        adjustModals();
        adjustDropdowns();
        adjustCards();
        hideMobileColumns();
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
    
    // ========================================
    // MELHORIAS PARA TOUCH DEVICES
    // ========================================
    
    // Detectar se é um dispositivo touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        // Adicionar classes para dispositivos touch
        document.body.classList.add('touch-device');
        
        // Melhorar interações touch
        const touchElements = document.querySelectorAll('.btn, .nav-link, .dropdown-item');
        touchElements.forEach(element => {
            element.style.minHeight = '44px';
            element.style.display = 'flex';
            element.style.alignItems = 'center';
        });
        
        // Melhorar inputs touch
        const touchInputs = document.querySelectorAll('input, select, textarea');
        touchInputs.forEach(input => {
            input.style.minHeight = '44px';
        });
    }
    
    // ========================================
    // MELHORIAS PARA ORIENTAÇÃO
    // ========================================
    
    // Detectar mudanças de orientação
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Recarregar ajustes após mudança de orientação
            adjustFormLayout();
            adjustModals();
            adjustDropdowns();
            adjustCards();
            hideMobileColumns();
        }, 100);
    });
    
    // ========================================
    // MELHORIAS PARA IMPRESSÃO
    // ========================================
    
    // Ajustar para impressão
    window.addEventListener('beforeprint', function() {
        closeSidebar();
        document.body.classList.add('printing');
    });
    
    window.addEventListener('afterprint', function() {
        document.body.classList.remove('printing');
    });
    
    // ========================================
    // MELHORIAS PARA ACESSIBILIDADE AVANÇADA
    // ========================================
    
    // Suporte para preferências de movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
    
    // Suporte para contraste alto
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
    }
    
    // ========================================
    // INICIALIZAÇÃO FINAL
    // ========================================
    
    // Garantir que tudo esteja configurado corretamente
    setTimeout(function() {
        adjustFormLayout();
        adjustModals();
        adjustDropdowns();
        adjustCards();
        hideMobileColumns();
        setActiveNavLink();
    }, 100);
    
    console.log('Responsividade inicializada com sucesso!');
});

// ========================================
// FUNÇÕES UTILITÁRIAS GLOBAIS
// ========================================

// Função para detectar se está em mobile
window.isMobile = function() {
    return window.innerWidth <= 991;
};

// Função para detectar se está em mobile pequeno
window.isSmallMobile = function() {
    return window.innerWidth <= 575;
};

// Função para detectar se está em tablet
window.isTablet = function() {
    return window.innerWidth > 575 && window.innerWidth <= 991;
};

// Função para detectar se está em desktop
window.isDesktop = function() {
    return window.innerWidth > 991;
};

// Função para fechar sidebar globalmente
window.closeSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const body = document.body;
    
    if (sidebar) {
        sidebar.classList.remove('show');
    }
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('show');
    }
    body.classList.remove('sidebar-open');
    document.documentElement.style.overflow = '';
}; 