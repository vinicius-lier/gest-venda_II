/**
 * Manipulação de botões de contratos
 */
$(document).ready(function() {
    console.log("Inicializando manipuladores para botões de contratos...");
    
    // Handler para botão de contratos
    $('.btn-contratos').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Botão de contratos clicado!");
        
        var menu = $(this).next('.contratos-menu');
        
        // Esconder todos os outros menus
        $('.contratos-menu').not(menu).removeClass('active');
        
        // Mostrar ou esconder o menu atual
        menu.toggleClass('active');
        
        // Posicionar corretamente o menu
        if (menu.hasClass('active')) {
            var button = $(this);
            var buttonPos = button.offset();
            var buttonHeight = button.outerHeight();
            
            // Verificar se estamos na lista ou no formulário
            var isForm = $('.contratos-container').closest('form').length > 0;
            
            if (isForm) {
                // Se estiver no formulário, posição relativa ao botão
                menu.css({
                    'position': 'absolute',
                    'top': buttonHeight + 5 + 'px',
                    'left': '0px',
                    'z-index': 99999
                });
            } else {
                // Se estiver na lista, posição fixa
                menu.css({
                    'position': 'fixed',
                    'top': (buttonPos.top + buttonHeight) + 'px',
                    'left': buttonPos.left + 'px',
                    'z-index': 99999
                });
            }
            
            console.log("Menu visível e posicionado:", menu.css('position'), menu.css('top'), menu.css('left'));
        }
    });
    
    // Fechar ao clicar fora
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.contratos-container').length) {
            $('.contratos-menu').removeClass('active');
        }
    });
    
    // Garantir que os menus permaneçam escondidos ao carregar a página
    $('.contratos-menu').removeClass('active');
}); 