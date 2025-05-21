/**
 * Autocomplete para clientes e motos
 */
$(document).ready(function() {
    // Autocomplete para clientes
    setupClienteAutocomplete();
    
    // Autocomplete para motos
    setupMotoAutocomplete();
    
    // Modal de novo cliente
    setupNovoClienteModal();
    
    // Modal de nova moto
    setupNovaMotoModal();
});

/**
 * Configura o autocomplete para campos de cliente
 */
function setupClienteAutocomplete() {
    // Variáveis para controle de debounce
    let debounceTimer;
    let isSubmitting = false;
    
    // Quando o usuário digita no campo de cliente
    $(document).on('keyup', '.autocomplete-field[data-type="cliente"]', function() {
        const input = $(this);
        const termo = input.val().trim();
        const container = input.closest('.autocomplete-container');
        const suggestionsDiv = container.find('.autocomplete-results');
        
        if (termo.length < 2) {
            suggestionsDiv.empty().hide();
            return;
        }
        
        // Aplicando debounce para evitar múltiplas requisições
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            console.log("Buscando clientes com termo:", termo);
            
            // Busca clientes por AJAX
            $.ajax({
                url: '/api/buscar-clientes/',
                data: { termo: termo },
                success: function(data) {
                    suggestionsDiv.empty();
                    
                    if (data.results.length === 0) {
                        suggestionsDiv.append('<div class="autocomplete-message">Nenhum cliente encontrado. Clique em "Cadastrar cliente" para adicionar.</div>');
                        suggestionsDiv.show();
                        return;
                    }
                    
                    // Cria a lista de sugestões
                    const ul = $('<ul class="list-group"></ul>');
                    data.results.forEach(function(cliente) {
                        const li = $('<li class="list-group-item autocomplete-item" data-type="cliente"></li>');
                        li.data('item', cliente);
                        li.text(cliente.text);
                        ul.append(li);
                    });
                    
                    suggestionsDiv.append(ul);
                    suggestionsDiv.show();
                },
                error: function(xhr, status, error) {
                    console.error("Erro ao buscar clientes:", error);
                    suggestionsDiv.empty();
                    suggestionsDiv.append('<div class="autocomplete-message">Erro ao buscar clientes</div>');
                    suggestionsDiv.show();
                }
            });
        }, 300); // Delay de 300ms para evitar muitas requisições
    });
    
    // Quando o usuário clica no ícone de busca
    $(document).on('click', '.autocomplete-search-icon', function() {
        const input = $(this).closest('.autocomplete-input-group').find('input');
        
        // Força a busca
        input.trigger('keyup');
    });
    
    // Quando o usuário seleciona um cliente da lista
    $(document).on('click', '.autocomplete-item[data-type="cliente"]', function() {
        const item = $(this).data('item');
        const container = $(this).closest('.autocomplete-container');
        const input = container.find('input.autocomplete-field');
        const idField = container.find('input[name="' + input.attr('name') + '_id"]');
        
        console.log("Cliente selecionado:", item);
        
        // Preenche o campo com o nome do cliente
        input.val(item.text);
        
        // Armazena o ID do cliente no campo oculto
        idField.val(item.id);
        
        // Esconde as sugestões
        container.find('.autocomplete-results').hide();
        
        // Dispara evento para informar que um cliente foi selecionado
        const event = new CustomEvent('autocomplete:selected', {
            detail: {
                field: input.attr('name'),
                item: item
            },
            bubbles: true
        });
        input[0].dispatchEvent(event);
    });
    
    // Oculta sugestões quando clicar fora
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.autocomplete-container').length) {
            $('.autocomplete-results').hide();
        }
    });
    
    // Botão para abrir modal de novo cliente
    $(document).on('click', '.btn-novo-cliente', function() {
        console.log("Abrindo modal de novo cliente");
        var myModal = new bootstrap.Modal(document.getElementById('modalNovoCliente'));
        myModal.show();
    });
}

/**
 * Configura o autocomplete para campos de moto
 */
function setupMotoAutocomplete() {
    // Quando o usuário digita no campo de moto
    $(document).on('keyup', '.autocomplete-field[data-type="moto"]', function() {
        const input = $(this);
        const termo = input.val().trim();
        const container = input.closest('.autocomplete-container');
        const suggestionsDiv = container.find('.autocomplete-results');
        const onlyAvailable = input.data('only-available') === undefined ? true : input.data('only-available');
        
        if (termo.length < 2) {
            suggestionsDiv.empty().hide();
            return;
        }
        
        console.log("Buscando motos com termo:", termo);
        
        // Busca motos por AJAX
        $.ajax({
            url: '/api/buscar-motos/',
            data: {
                termo: termo,
                disponivel: onlyAvailable
            },
            success: function(data) {
                suggestionsDiv.empty();
                
                if (data.results.length === 0) {
                    suggestionsDiv.append('<div class="autocomplete-message">Nenhuma moto encontrada. Clique em "Cadastrar moto" para adicionar.</div>');
                    suggestionsDiv.show();
                    return;
                }
                
                // Cria a lista de sugestões
                const ul = $('<ul class="list-group"></ul>');
                data.results.forEach(function(moto) {
                    const li = $('<li class="list-group-item autocomplete-item" data-type="moto"></li>');
                    li.data('item', moto);
                    li.text(moto.text);
                    ul.append(li);
                });
                
                suggestionsDiv.append(ul);
                suggestionsDiv.show();
            },
            error: function(xhr, status, error) {
                console.error("Erro ao buscar motos:", error);
                suggestionsDiv.empty();
                suggestionsDiv.append('<div class="autocomplete-message">Erro ao buscar motos</div>');
                suggestionsDiv.show();
            }
        });
    });
    
    // Quando o usuário seleciona uma moto da lista
    $(document).on('click', '.autocomplete-item[data-type="moto"]', function() {
        const item = $(this).data('item');
        const container = $(this).closest('.autocomplete-container');
        const input = container.find('input.autocomplete-field');
        const idField = container.find('input[name="' + input.attr('name') + '_id"]');
        
        console.log("Moto selecionada:", item);
        
        // Preenche o campo com o nome da moto
        input.val(item.text);
        
        // Armazena o ID da moto no campo oculto
        idField.val(item.id);
        
        // Esconde as sugestões
        container.find('.autocomplete-results').hide();
        
        // Dispara evento para informar que uma moto foi selecionada
        const event = new CustomEvent('autocomplete:selected', {
            detail: {
                field: input.attr('name'),
                item: item
            },
            bubbles: true
        });
        input[0].dispatchEvent(event);
    });
    
    // Botão para abrir modal de nova moto
    $(document).on('click', '.btn-nova-moto', function() {
        console.log("Abrindo modal de nova moto");
        var myModal = new bootstrap.Modal(document.getElementById('modalNovaMoto'));
        myModal.show();
    });
}

/**
 * Configura o modal de novo cliente
 */
function setupNovoClienteModal() {
    // Flag para controlar submissão em andamento
    let isSubmitting = false;
    
    // Quando o usuário clica em salvar novo cliente
    $(document).on('click', '#btnSalvarNovoCliente', function() {
        // Previne múltiplos cliques
        if (isSubmitting) return;
        
        const nome = $('#novoClienteNome').val().trim();
        const telefone = $('#novoClienteTelefone').val().trim();
        const cpf = $('#novoClienteCPF').val().trim();
        
        if (!nome) {
            alert('O nome é obrigatório');
            return;
        }
        
        console.log("Salvando novo cliente:", nome);
        
        // Marca que está em processo de submissão
        isSubmitting = true;
        
        // Salva o novo cliente por AJAX
        $.ajax({
            url: '/api/criar-cliente-rapido/',
            method: 'POST',
            data: {
                nome: nome,
                telefone: telefone,
                cpf: cpf,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(data) {
                if (data.success) {
                    // Fecha o modal
                    $('#modalNovoCliente').modal('hide');
                    
                    // Limpa o formulário
                    $('#formNovoCliente')[0].reset();
                    
                    // Seleciona o cliente recém-criado
                    const cliente = data.cliente;
                    
                    // Busca o campo de cliente mais recentemente utilizado
                    const input = $('.autocomplete-field[data-type="cliente"]').last();
                    const container = input.closest('.autocomplete-container');
                    const idField = container.find('input[name="' + input.attr('name') + '_id"]');
                    
                    console.log("Preenchendo campo com novo cliente:", cliente);
                    
                    // Preenche o campo com o nome do cliente
                    input.val(cliente.text);
                    
                    // Armazena o ID do cliente no campo oculto
                    idField.val(cliente.id);
                    
                    // Dispara evento para informar que um cliente foi selecionado
                    const event = new CustomEvent('autocomplete:selected', {
                        detail: {
                            field: input.attr('name'),
                            item: cliente
                        },
                        bubbles: true
                    });
                    input[0].dispatchEvent(event);
                    
                    // Exibe mensagem de sucesso
                    alert('Cliente cadastrado com sucesso!');
                } else {
                    alert('Erro ao cadastrar cliente: ' + data.error);
                }
            },
            error: function(xhr, status, error) {
                console.error("Erro ao cadastrar cliente:", error);
                alert('Erro ao cadastrar cliente');
            },
            complete: function() {
                // Marca que a submissão foi concluída
                isSubmitting = false;
            }
        });
    });
    
    // Corrige o comportamento do botão de fechar
    $(document).on('click', '[data-bs-dismiss="modal"]', function() {
        var modalElement = $(this).closest('.modal')[0];
        var modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    });
}

/**
 * Configura o modal de nova moto
 */
function setupNovaMotoModal() {
    // Quando o usuário clica em salvar nova moto
    $(document).on('click', '#btnSalvarNovaMoto', function() {
        const marca = $('#novaMotoMarca').val().trim();
        const modelo = $('#novaMotoModelo').val().trim();
        const ano = $('#novaMotoAno').val().trim();
        const cor = $('#novaMotoCor').val().trim();
        const placa = $('#novaMotoPlaca').val().trim();
        const chassi = $('#novaMotoChassi').val().trim();
        const valor = $('#novaMotoValor').val().trim();
        
        if (!marca || !modelo || !ano || !cor || !chassi || !valor) {
            alert('Todos os campos marcados com * são obrigatórios');
            return;
        }
        
        console.log("Salvando nova moto:", modelo);
        
        // Salva a nova moto por AJAX
        $.ajax({
            url: '/api/criar-moto-rapida/',
            method: 'POST',
            data: {
                marca: marca,
                modelo: modelo,
                ano: ano,
                cor: cor,
                placa: placa,
                chassi: chassi,
                valor: valor,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(data) {
                if (data.success) {
                    // Fecha o modal
                    $('#modalNovaMoto').modal('hide');
                    
                    // Limpa o formulário
                    $('#formNovaMoto')[0].reset();
                    
                    // Seleciona a moto recém-criada
                    const moto = data.moto;
                    
                    // Busca o campo de moto mais recentemente utilizado
                    const input = $('.autocomplete-field[data-type="moto"]').last();
                    const container = input.closest('.autocomplete-container');
                    const idField = container.find('input[name="' + input.attr('name') + '_id"]');
                    
                    console.log("Preenchendo campo com nova moto:", moto);
                    
                    // Preenche o campo com o texto da moto
                    input.val(moto.text);
                    
                    // Armazena o ID da moto no campo oculto
                    idField.val(moto.id);
                    
                    // Dispara evento para informar que uma moto foi selecionada
                    const event = new CustomEvent('autocomplete:selected', {
                        detail: {
                            field: input.attr('name'),
                            item: moto
                        },
                        bubbles: true
                    });
                    input[0].dispatchEvent(event);
                    
                    // Exibe mensagem de sucesso
                    alert('Moto cadastrada com sucesso!');
                } else {
                    alert('Erro ao cadastrar moto: ' + data.error);
                }
            },
            error: function(xhr) {
                alert('Erro ao cadastrar moto');
                console.error(xhr.responseText);
            }
        });
    });
} 