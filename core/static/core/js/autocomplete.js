/**
 * Autocomplete para clientes e motos
 */
$(document).ready(function() {
    console.log("Inicializando autocomplete e modais...");
    
    // Inicializar setupClienteAutocomplete e setupMotoAutocomplete
    setupClienteAutocomplete();
    setupMotoAutocomplete();
    setupProprietarioAutocomplete();
    setupFornecedorAutocomplete();
    
    // Inicializar modais
    setupNovoClienteModal();
    setupNovaMotoModal();
    setupNovoProprietarioModal();
    setupNovoFornecedorModal();
    
    // Log para verificar se a inicialização foi bem-sucedida
    console.log("Campos de autocomplete inicializados:", {
        cliente: $("#id_cliente_text").length,
        moto: $("#id_moto_text").length,
        proprietario: $("#id_proprietario_text").length,
        fornecedor: $("#id_fornecedor_text").length
    });
    
    // Função para inicializar os campos de texto na edição
    function inicializarCamposEdicao() {
        console.log("Verificando se é um formulário de edição...");
        
        // Verificar se os campos hidden têm valores
        const clienteId = $("#id_cliente").val();
        const motoId = $("#id_moto").val();
        const proprietarioId = $("#id_proprietario").val();
        const fornecedorId = $("#id_fornecedor").val();
        
        console.log("Valores dos campos hidden:", {
            cliente: clienteId,
            moto: motoId,
            proprietario: proprietarioId,
            fornecedor: fornecedorId
        });
        
        // Cliente
        if (clienteId) {
            console.log("Cliente ID já preenchido:", clienteId);
            // Tentar duas abordagens: 1) Usar a API, 2) Usar dados do formulário
            
            // 1) Abordagem pela API
            $.ajax({
                url: "/api/cliente/" + clienteId + "/",
                dataType: "json",
                success: function(data) {
                    $("#id_cliente_text").val(data.nome);
                    // Preencher também o campo de contato com o telefone do cliente
                    if (data.telefone && !$("#id_contato").val()) {
                        $("#id_contato").val(data.telefone);
                    }
                    showClienteInfo(clienteId);
                },
                error: function() {
                    console.error("Falha ao buscar cliente pela API. Tentando alternativa.");
                    // 2) Abordagem alternativa: verificar se há dados em um campo hidden ou data attribute
                    if ($("input[name='cliente_nome']").length) {
                        $("#id_cliente_text").val($("input[name='cliente_nome']").val());
                    } else {
                        // Buscar do back-end usando um simples POST
                        fetch("/api/cliente/" + clienteId + "/", {
                            method: 'GET',
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            $("#id_cliente_text").val(data.nome);
                            showClienteInfo(clienteId);
                        })
                        .catch(error => console.error("Erro ao buscar cliente:", error));
                    }
                }
            });
        }
        
        // Moto
        if (motoId) {
            console.log("Moto ID já preenchida:", motoId);
            $.ajax({
                url: "/api/moto/" + motoId + "/",
                dataType: "json",
                success: function(data) {
                    $("#id_moto_text").val(`${data.marca} ${data.modelo} (${data.ano})`);
                    showMotoInfo(motoId);
                },
                error: function() {
                    console.error("Falha ao buscar moto pela API. Tentando alternativa.");
                    // Abordagem alternativa: verificar se há dados em um campo hidden ou data attribute
                    if ($("input[name='moto_nome']").length) {
                        $("#id_moto_text").val($("input[name='moto_nome']").val());
                    } else {
                        // Buscar do back-end usando um simples POST
                        fetch("/api/moto/" + motoId + "/", {
                            method: 'GET',
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            $("#id_moto_text").val(`${data.marca} ${data.modelo} (${data.ano})`);
                            showMotoInfo(motoId);
                        })
                        .catch(error => console.error("Erro ao buscar moto:", error));
                    }
                }
            });
        }
        
        // Proprietário
        if (proprietarioId) {
            console.log("Proprietário ID já preenchido:", proprietarioId);
            $.ajax({
                url: "/api/proprietario/" + proprietarioId + "/",
                dataType: "json",
                success: function(data) {
                    $("#id_proprietario_text").val(data.nome);
                    showProprietarioInfo(proprietarioId);
                },
                error: function() {
                    console.error("Falha ao buscar proprietário pela API. Tentando alternativa.");
                    // Abordagem alternativa: usar a API de cliente
                    $.ajax({
                        url: "/api/cliente/" + proprietarioId + "/",
                        dataType: "json",
                        success: function(data) {
                            $("#id_proprietario_text").val(data.nome);
                            showProprietarioInfo(proprietarioId);
                        },
                        error: function() {
                            console.error("Falha ao buscar proprietário como cliente. Tentando outra alternativa.");
                            if ($("input[name='proprietario_nome']").length) {
                                $("#id_proprietario_text").val($("input[name='proprietario_nome']").val());
                            }
                        }
                    });
                }
            });
        }
        
        // Fornecedor
        if (fornecedorId) {
            console.log("Fornecedor ID já preenchido:", fornecedorId);
            $.ajax({
                url: "/api/fornecedor/" + fornecedorId + "/",
                dataType: "json",
                success: function(data) {
                    $("#id_fornecedor_text").val(data.nome);
                    showFornecedorInfo(fornecedorId);
                },
                error: function() {
                    console.error("Falha ao buscar fornecedor pela API. Tentando alternativa.");
                    // Abordagem alternativa: usar a API de cliente
                    $.ajax({
                        url: "/api/cliente/" + fornecedorId + "/",
                        dataType: "json",
                        success: function(data) {
                            $("#id_fornecedor_text").val(data.nome);
                            showFornecedorInfo(fornecedorId);
                        },
                        error: function() {
                            console.error("Falha ao buscar fornecedor como cliente. Tentando outra alternativa.");
                            if ($("input[name='fornecedor_nome']").length) {
                                $("#id_fornecedor_text").val($("input[name='fornecedor_nome']").val());
                            }
                        }
                    });
                }
            });
        }
    }
    
    // Executar a inicialização dos campos de edição
    inicializarCamposEdicao();
    
    // Para cada campo de autocomplete, verifica se já tem um valor inicial
    // Se tiver, mostra a caixa de informações
    if ($("#id_cliente").val()) {
        console.log("Cliente ID já preenchido:", $("#id_cliente").val());
        showClienteInfo($("#id_cliente").val());
    }
    
    if ($("#id_moto").val()) {
        console.log("Moto ID já preenchida:", $("#id_moto").val());
        showMotoInfo($("#id_moto").val());
    }
    
    if ($("#id_proprietario").val()) {
        console.log("Proprietário ID já preenchido:", $("#id_proprietario").val());
        showProprietarioInfo($("#id_proprietario").val());
    }
    
    if ($("#id_fornecedor").val()) {
        console.log("Fornecedor ID já preenchido:", $("#id_fornecedor").val());
        showFornecedorInfo($("#id_fornecedor").val());
    }
    
    // Verificar se há eventos de keyup em cada campo
    $("#id_cliente_text").on("keyup", function() {
        console.log("Evento keyup no campo cliente");
    });
    
    $("#id_moto_text").on("keyup", function() {
        console.log("Evento keyup no campo moto");
    });
    
    $("#id_proprietario_text").on("keyup", function() {
        console.log("Evento keyup no campo proprietário");
    });
    
    $("#id_fornecedor_text").on("keyup", function() {
        console.log("Evento keyup no campo fornecedor");
    });
    
    // Inicializar modais de cadastro rápido
    initCadastroRapido(
        "#btn_novo_cliente", 
        "#modal_novo_cliente", 
        "#form_novo_cliente",
        function(data) {
            console.log("Cliente criado:", data);
            $("#id_cliente").val(data.id);
            $("#id_cliente_text").val(data.nome);
            $("#cliente_info").html(
                "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                "<strong>Telefone:</strong> " + (data.telefone || "N/A") + "<br>" +
                "<strong>Email:</strong> " + (data.email || "N/A") + "<br>" +
                "<strong>Endereço:</strong> " + (data.endereco || "N/A")
            );
            $("#cliente_info").show();
            
            // Garantir que o campo de contato esteja vazio
            $("#id_contato").val("");
        }
    );
    
    initCadastroRapido(
        "#btn_nova_moto", 
        "#modal_nova_moto", 
        "#form_nova_moto",
        function(data) {
            console.log("Moto criada:", data);
            $("#id_moto").val(data.id);
            $("#id_moto_text").val(data.marca + " " + data.modelo);
            $("#moto_info").html(
                "<strong>Marca:</strong> " + (data.marca || "N/A") + "<br>" +
                "<strong>Modelo:</strong> " + (data.modelo || "N/A") + "<br>" +
                "<strong>Ano:</strong> " + (data.ano || "N/A") + "<br>" +
                "<strong>Placa:</strong> " + (data.placa || "N/A")
            );
            $("#moto_info").show();
            
            // Esconder campo de modelo de interesse
            $('#modeloInteresseRow').hide();
        }
    );
    
    initCadastroRapido(
        "#btn_novo_proprietario", 
        "#modal_novo_proprietario", 
        "#form_novo_proprietario",
        function(data) {
            console.log("Proprietário criado:", data);
            $("#id_proprietario").val(data.id);
            $("#id_proprietario_text").val(data.nome);
            $("#proprietario_info").html(
                "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                "<strong>Telefone:</strong> " + (data.telefone || "N/A")
            );
            $("#proprietario_info").show();
            
            // Se o fornecedor estiver vazio, sugerir o mesmo que o proprietário
            if (!$("#id_fornecedor").val()) {
                $("#id_fornecedor").val(data.id);
                $("#id_fornecedor_text").val(data.nome);
                
                // Também atualizar as informações do fornecedor
                $("#fornecedor_info").html(
                    "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                    "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                    "<strong>Telefone:</strong> " + (data.telefone || "N/A")
                );
                $("#fornecedor_info").show();
            }
        }
    );
    
    initCadastroRapido(
        "#btn_novo_fornecedor", 
        "#modal_novo_fornecedor", 
        "#form_novo_fornecedor",
        function(data) {
            console.log("Fornecedor criado:", data);
            $("#id_fornecedor").val(data.id);
            $("#id_fornecedor_text").val(data.nome);
            $("#fornecedor_info").html(
                "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                "<strong>Telefone:</strong> " + (data.telefone || "N/A")
            );
            $("#fornecedor_info").show();
        }
    );

    // Inicialização global para todos os campos de cliente (inclui proprietário e fornecedor)
    $("input.autocomplete-field[data-type='cliente']").each(function() {
        var $input = $(this);
        var minLength = 2;
        $input.autocomplete({
            source: function(request, response) {
                $.ajax({
                    url: "/api/cliente/search/",
                    dataType: "json",
                    data: {
                        term: request.term
                    },
                    success: function(data) {
                        response($.map(data, function(item) {
                            return {
                                label: item.nome + (item.cpf ? ' (' + item.cpf + ')' : ''),
                                value: item.nome,
                                id: item.id
                            };
                        }));
                    }
                });
            },
            minLength: minLength,
            select: function(event, ui) {
                $input.val(ui.item.value);
                var idField = $("#" + $input.attr("id").replace("_text", ""));
                if (idField.length) {
                    idField.val(ui.item.id);
                }
                return false;
            }
        });
    });

    // Autocomplete para Cliente
    $("#id_cliente_text").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: "/api/cliente/search/",
                dataType: "json",
                data: { term: request.term },
                success: function(data) {
                    response($.map(data, function(item) {
                        return {
                            label: item.nome,
                            value: item.nome,
                            id: item.id,
                            text: item.text || item.nome
                        };
                    }));
                }
            });
        },
        minLength: 2,
        focus: function(event, ui) {
            $("#id_cliente_text").val(ui.item.text || ui.item.nome || ui.item.label || '');
            return false;
        },
        select: function(event, ui) {
            $("#id_cliente_text").val(ui.item.text || ui.item.nome || ui.item.label || '');
            $("#id_cliente").val(ui.item.id);
            return false;
        }
    });

    // Autocomplete para Proprietário
    $("#id_proprietario_text").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: "/api/cliente/search/",
                dataType: "json",
                data: { term: request.term },
                success: function(data) {
                    response($.map(data, function(item) {
                        return {
                            label: item.nome,
                            value: item.nome,
                            id: item.id,
                            text: item.text || item.nome
                        };
                    }));
                }
            });
        },
        minLength: 2,
        focus: function(event, ui) {
            $("#id_proprietario_text").val(ui.item.text || ui.item.nome || ui.item.label || '');
            return false;
        },
        select: function(event, ui) {
            $("#id_proprietario_text").val(ui.item.text || ui.item.nome || ui.item.label || '');
            $("#id_proprietario").val(ui.item.id);
            return false;
        }
    });

    // Autocomplete para Fornecedor
    $("#id_fornecedor_text").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: "/api/cliente/search/",
                dataType: "json",
                data: { term: request.term },
                success: function(data) {
                    response($.map(data, function(item) {
                        return {
                            label: item.nome,
                            value: item.nome,
                            id: item.id,
                            text: item.text || item.nome
                        };
                    }));
                }
            });
        },
        minLength: 2,
        focus: function(event, ui) {
            $("#id_fornecedor_text").val(ui.item.text || ui.item.nome || ui.item.label || '');
            return false;
        },
        select: function(event, ui) {
            $("#id_fornecedor_text").val(ui.item.text || ui.item.nome || ui.item.label || '');
            $("#id_fornecedor").val(ui.item.id);
            return false;
        }
    });
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
                url: '/api/cliente/search/',
                data: { term: termo },
                success: function(data) {
                    suggestionsDiv.empty();
                    
                    if (data.length === 0) {
                        suggestionsDiv.append('<div class="autocomplete-message">Nenhum cliente encontrado. Clique em "Cadastrar cliente" para adicionar.</div>');
                        suggestionsDiv.show();
                        return;
                    }
                    
                    // Cria a lista de sugestões
                    const ul = $('<ul class="list-group"></ul>');
                    data.forEach(function(cliente) {
                        const li = $('<li class="list-group-item autocomplete-item" data-type="cliente"></li>');
                        li.data('item', cliente);
                        li.text(cliente.label);
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
    
    // Quando o usuário seleciona um cliente da lista
    $(document).on('click', '.autocomplete-item[data-type="cliente"]', function() {
        const item = $(this).data('item');
        const container = $(this).closest('.autocomplete-container');
        const input = container.find('input.autocomplete-field');
        const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
        
        console.log("Cliente selecionado:", item);
        
        // Preenche o campo com o nome do cliente
        input.val(item.label || item.value);
        
        // Armazena o ID do cliente no campo oculto
        idField.val(item.id);
        
        // Esconde as sugestões
        container.find('.autocomplete-results').hide();
        
        // Preencher diretamente o campo de contato com o telefone, se disponível no item
        if (item.telefone) {
            $("#id_contato").val(item.telefone);
        }
        
        // Buscar informações adicionais do cliente para exibir
        $.ajax({
            url: "/api/cliente/" + item.id + "/",
            dataType: "json",
            success: function(data) {
                // Preencher o campo de contato com o telefone do cliente se ainda não estiver preenchido
                if (data.telefone && !$("#id_contato").val()) {
                    $("#id_contato").val(data.telefone);
                }
                
                // Preencher os campos com dados do cliente
                $("#cliente_info").html(
                    "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                    "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                    "<strong>Telefone:</strong> " + (data.telefone || "N/A") + "<br>" +
                    "<strong>Email:</strong> " + (data.email || "N/A") + "<br>" +
                    "<strong>Endereço:</strong> " + (data.endereco || "N/A")
                );
                $("#cliente_info").show();
            }
        });
        
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
            url: '/api/moto/search/',
            data: {
                term: termo,
                disponivel: onlyAvailable
            },
            success: function(data) {
                console.log("Resposta da busca de motos:", data);
                suggestionsDiv.empty();
                
                if (data.length === 0) {
                    console.log("Nenhuma moto encontrada");
                    suggestionsDiv.append('<div class="autocomplete-message">Nenhuma moto encontrada. Clique em "Cadastrar moto" para adicionar.</div>');
                    suggestionsDiv.show();
                    return;
                }
                
                // Cria a lista de sugestões
                const ul = $('<ul class="list-group"></ul>');
                data.forEach(function(moto) {
                    console.log("Adicionando moto à lista:", moto);
                    const li = $('<li class="list-group-item autocomplete-item" data-type="moto"></li>');
                    li.data('item', moto);
                    li.text(moto.label);
                    ul.append(li);
                });
                
                suggestionsDiv.append(ul);
                suggestionsDiv.show();
            },
            error: function(xhr, status, error) {
                console.error("Erro ao buscar motos:", error);
                console.error("Status:", status);
                console.error("Resposta:", xhr.responseText);
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
        const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
        
        console.log("Moto selecionada:", item);
        
        // Preenche o campo com o nome da moto
        input.val(item.label || item.value);
        
        // Armazena o ID da moto no campo oculto
        idField.val(item.id);
        
        // Esconde as sugestões
        container.find('.autocomplete-results').hide();
        
        // Preenche o valor da venda automaticamente se estiver vazio
        if (item.valor && $('#id_valor_venda').length && !$('#id_valor_venda').val()) {
            $('#id_valor_venda').val(item.valor);
        }
        
        // Carrega dados adicionais da moto
        carregarDetalhesMoto(item.id);
        
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
    $(document).on('click', '#btn_nova_moto', function() {
        console.log("Abrindo modal de nova moto");
        var myModal = new bootstrap.Modal(document.getElementById('modal_nova_moto'));
        myModal.show();
    });
    
    // Carregar detalhes da moto ao inicializar, se já tiver um ID preenchido
    const motoId = $('#id_moto').val();
    if (motoId) {
        console.log("Carregando detalhes da moto ID:", motoId);
        carregarDetalhesMoto(motoId);
    }
}

// Função para carregar detalhes da moto
function carregarDetalhesMoto(motoId) {
    $.ajax({
        url: "/api/moto/" + motoId + "/",
        dataType: "json",
        success: function(data) {
            // Preencher os campos com dados da moto
            $("#moto_info").html(
                "<strong>Marca:</strong> " + (data.marca || "N/A") + "<br>" +
                "<strong>Modelo:</strong> " + (data.modelo || "N/A") + "<br>" +
                "<strong>Ano:</strong> " + (data.ano || "N/A") + "<br>" +
                "<strong>Placa:</strong> " + (data.placa || "N/A")
            );
            $("#moto_info").show();
            
            // Esconder campo de modelo de interesse
            $('#modeloInteresseRow').hide();
        },
        error: function(xhr, status, error) {
            console.error("Erro ao carregar detalhes da moto:", error);
        }
    });
}

/**
 * Configura o autocomplete para campos de proprietário
 */
function setupProprietarioAutocomplete() {
    // Variáveis para controle de debounce
    let debounceTimer;
    
    // Quando o usuário digita no campo de proprietário
    $(document).on('keyup', '.autocomplete-field[data-type="proprietario"]', function() {
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
            console.log("Buscando proprietários com termo:", termo);
            
            // Busca proprietários por AJAX
            $.ajax({
                url: '/api/proprietario/search/',
                data: { term: termo },
                success: function(data) {
                    suggestionsDiv.empty();
                    
                    if (data.length === 0) {
                        suggestionsDiv.append('<div class="autocomplete-message">Nenhum proprietário encontrado. Clique em "Cadastrar proprietário" para adicionar.</div>');
                        suggestionsDiv.show();
                        return;
                    }
                    
                    // Cria a lista de sugestões
                    const ul = $('<ul class="list-group"></ul>');
                    data.forEach(function(proprietario) {
                        const li = $('<li class="list-group-item autocomplete-item" data-type="proprietario"></li>');
                        li.data('item', proprietario);
                        li.text(proprietario.label);
                        ul.append(li);
                    });
                    
                    suggestionsDiv.append(ul);
                    suggestionsDiv.show();
                },
                error: function(xhr, status, error) {
                    console.error("Erro ao buscar proprietários:", error);
                    suggestionsDiv.empty();
                    suggestionsDiv.append('<div class="autocomplete-message">Erro ao buscar proprietários</div>');
                    suggestionsDiv.show();
                }
            });
        }, 300); // Delay de 300ms para evitar muitas requisições
    });
    
    // Quando o usuário seleciona um proprietário da lista
    $(document).on('click', '.autocomplete-item[data-type="proprietario"]', function() {
        const item = $(this).data('item');
        const container = $(this).closest('.autocomplete-container');
        const input = container.find('input.autocomplete-field');
        const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
        
        console.log("Proprietário selecionado:", item);
        
        // Preenche o campo com o nome do proprietário
        input.val(item.label || item.value);
        
        // Armazena o ID do proprietário no campo oculto
        idField.val(item.id);
        
        // Esconde as sugestões
        container.find('.autocomplete-results').hide();
        
        // Carrega dados adicionais do proprietário
        $.ajax({
            url: "/api/proprietario/" + item.id + "/",
            dataType: "json",
            success: function(data) {
                // Preencher os campos com dados do proprietário
                $("#proprietario_info").html(
                    "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                    "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                    "<strong>Telefone:</strong> " + (data.telefone || "N/A")
                );
                $("#proprietario_info").show();
                
                // Se o fornecedor estiver vazio, sugerir o mesmo que o proprietário
                if (!$("#id_fornecedor").val()) {
                    $("#id_fornecedor").val(item.id);
                    $("#id_fornecedor_text").val(item.label || item.value);
                    
                    // Também atualizar as informações do fornecedor
                    $("#fornecedor_info").html(
                        "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                        "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                        "<strong>Telefone:</strong> " + (data.telefone || "N/A")
                    );
                    $("#fornecedor_info").show();
                }
            }
        });
        
        // Dispara evento para informar que um proprietário foi selecionado
        const event = new CustomEvent('autocomplete:selected', {
            detail: {
                field: input.attr('name'),
                item: item
            },
            bubbles: true
        });
        input[0].dispatchEvent(event);
    });
}

/**
 * Configura o autocomplete para campos de fornecedor
 */
function setupFornecedorAutocomplete() {
    // Variáveis para controle de debounce
    let debounceTimer;
    
    // Quando o usuário digita no campo de fornecedor
    $(document).on('keyup', '.autocomplete-field[data-type="fornecedor"]', function() {
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
            console.log("Buscando fornecedores com termo:", termo);
            
            // Busca fornecedores por AJAX
            $.ajax({
                url: '/api/fornecedor/search/',
                data: { term: termo },
                success: function(data) {
                    suggestionsDiv.empty();
                    
                    if (data.length === 0) {
                        suggestionsDiv.append('<div class="autocomplete-message">Nenhum fornecedor encontrado. Clique em "Cadastrar fornecedor" para adicionar.</div>');
                        suggestionsDiv.show();
                        return;
                    }
                    
                    // Cria a lista de sugestões
                    const ul = $('<ul class="list-group"></ul>');
                    data.forEach(function(fornecedor) {
                        const li = $('<li class="list-group-item autocomplete-item" data-type="fornecedor"></li>');
                        li.data('item', fornecedor);
                        li.text(fornecedor.label);
                        ul.append(li);
                    });
                    
                    suggestionsDiv.append(ul);
                    suggestionsDiv.show();
                },
                error: function(xhr, status, error) {
                    console.error("Erro ao buscar fornecedores:", error);
                    suggestionsDiv.empty();
                    suggestionsDiv.append('<div class="autocomplete-message">Erro ao buscar fornecedores</div>');
                    suggestionsDiv.show();
                }
            });
        }, 300); // Delay de 300ms para evitar muitas requisições
    });
    
    // Quando o usuário seleciona um fornecedor da lista
    $(document).on('click', '.autocomplete-item[data-type="fornecedor"]', function() {
        const item = $(this).data('item');
        const container = $(this).closest('.autocomplete-container');
        const input = container.find('input.autocomplete-field');
        const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
        
        console.log("Fornecedor selecionado:", item);
        
        // Preenche o campo com o nome do fornecedor
        input.val(item.label || item.value);
        
        // Armazena o ID do fornecedor no campo oculto
        idField.val(item.id);
        
        // Esconde as sugestões
        container.find('.autocomplete-results').hide();
        
        // Carrega dados adicionais do fornecedor
        $.ajax({
            url: "/api/fornecedor/" + item.id + "/",
            dataType: "json",
            success: function(data) {
                // Preencher os campos com dados do fornecedor
                $("#fornecedor_info").html(
                    "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                    "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                    "<strong>Telefone:</strong> " + (data.telefone || "N/A")
                );
                $("#fornecedor_info").show();
            },
            error: function() {
                // Se não encontrar como fornecedor, tenta buscar como cliente
                $.ajax({
                    url: "/api/cliente/" + item.id + "/",
                    dataType: "json",
                    success: function(data) {
                        $("#fornecedor_info").html(
                            "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                            "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                            "<strong>Telefone:</strong> " + (data.telefone || "N/A") + "<br>" +
                            "<strong>Email:</strong> " + (data.email || "N/A") + "<br>" +
                            "<strong>Endereço:</strong> " + (data.endereco || "N/A")
                        );
                        $("#fornecedor_info").show();
                    }
                });
            }
        });
        
        // Dispara evento para informar que um fornecedor foi selecionado
        const event = new CustomEvent('autocomplete:selected', {
            detail: {
                field: input.attr('name'),
                item: item
            },
            bubbles: true
        });
        input[0].dispatchEvent(event);
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
        const email = $('#novoClienteEmail').val().trim();
        const endereco = $('#novoClienteEndereco').val().trim();
        
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
                email: email,
                endereco: endereco,
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(data) {
                if (data.success) {
                    // Fecha o modal
                    $('#modalNovoCliente').modal('hide');
                    var clienteModal = bootstrap.Modal.getInstance(document.getElementById('modal_novo_cliente'));
                    if (clienteModal) {
                        clienteModal.hide();
                    }
                    
                    // Limpa o formulário
                    $('#formNovoCliente')[0].reset();
                    $('#form_novo_cliente')[0].reset();
                    
                    // Seleciona o cliente recém-criado
                    const cliente = data.cliente;
                    
                    // Busca o campo de cliente mais recentemente utilizado
                    const input = $('.autocomplete-field[data-type="cliente"]').last();
                    const container = input.closest('.autocomplete-container');
                    const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
                    
                    console.log("Preenchendo campo com novo cliente:", cliente);
                    
                    // Preenche o campo com o nome do cliente
                    input.val(cliente.nome);
                    
                    // Armazena o ID do cliente no campo oculto
                    idField.val(cliente.id);
                    
                    // Preencher campo de contato se estiver disponível
                    if (cliente.telefone && $("#id_contato").length) {
                        $("#id_contato").val(cliente.telefone);
                    }
                    
                    // Atualiza as informações do cliente na página
                    $("#cliente_info").html(
                        "<strong>CPF:</strong> " + (cliente.cpf || "N/A") + "<br>" +
                        "<strong>Telefone:</strong> " + (cliente.telefone || "N/A") + "<br>" +
                        "<strong>Email:</strong> " + (cliente.email || "N/A") + "<br>" +
                        "<strong>Endereço:</strong> " + (cliente.endereco || "N/A")
                    );
                    $("#cliente_info").show();
                    
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
                    alert('Cliente cadastrado com sucesso no banco de dados!');
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
                    var motoModal = bootstrap.Modal.getInstance(document.getElementById('modal_nova_moto'));
                    if (motoModal) {
                        motoModal.hide();
                    }
                    
                    // Limpa o formulário
                    $('#formNovaMoto')[0].reset();
                    $('#form_nova_moto')[0].reset();
                    
                    // Seleciona a moto recém-criada
                    const moto = data.moto;
                    
                    // Busca o campo de moto mais recentemente utilizado
                    const input = $('.autocomplete-field[data-type="moto"]').last();
                    const container = input.closest('.autocomplete-container');
                    const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
                    
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
                    alert('Moto cadastrada com sucesso e adicionada ao estoque!');
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

/**
 * Configura o modal de novo proprietário
 */
function setupNovoProprietarioModal() {
    // Flag para controlar submissão em andamento
    let isSubmitting = false;
    
    // Quando o usuário clica em salvar novo proprietário
    $(document).on('click', '#btnSalvarNovoProprietario', function() {
        // Previne múltiplos cliques
        if (isSubmitting) return;
        
        const nome = $('#novoProprietarioNome').val().trim();
        const telefone = $('#novoProprietarioTelefone').val().trim();
        const cpf = $('#novoProprietarioCPF').val().trim();
        const endereco = $('#novoProprietarioEndereco').val().trim();
        
        if (!nome) {
            alert('O nome é obrigatório');
            return;
        }
        
        console.log("Salvando novo proprietário:", nome);
        
        // Marca que está em processo de submissão
        isSubmitting = true;
        
        // Salva o novo proprietário por AJAX (usa a mesma API de cliente)
        $.ajax({
            url: '/api/criar-cliente-rapido/',
            method: 'POST',
            data: {
                nome: nome,
                telefone: telefone,
                cpf: cpf,
                endereco: endereco,
                tipo: 'PROPRIETARIO',
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(data) {
                if (data.success) {
                    // Fecha o modal
                    var proprietarioModal = bootstrap.Modal.getInstance(document.getElementById('modal_novo_proprietario'));
                    if (proprietarioModal) {
                        proprietarioModal.hide();
                    }
                    
                    // Limpa o formulário
                    $('#form_novo_proprietario')[0].reset();
                    
                    // Seleciona o proprietário recém-criado
                    const proprietario = data.cliente;
                    
                    // Busca o campo de proprietário mais recentemente utilizado
                    const input = $('.autocomplete-field[data-type="proprietario"]').last();
                    const container = input.closest('.autocomplete-container');
                    const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
                    
                    console.log("Preenchendo campo com novo proprietário:", proprietario);
                    
                    // Preenche o campo com o nome do proprietário
                    input.val(proprietario.nome);
                    
                    // Armazena o ID do proprietário no campo oculto
                    idField.val(proprietario.id);
                    
                    // Atualiza as informações do proprietário na página
                    $("#proprietario_info").html(
                        "<strong>CPF:</strong> " + (proprietario.cpf || "N/A") + "<br>" +
                        "<strong>Telefone:</strong> " + (proprietario.telefone || "N/A") + "<br>" +
                        "<strong>Endereço:</strong> " + (proprietario.endereco || "N/A")
                    );
                    $("#proprietario_info").show();
                    
                    // Dispara evento para informar que um proprietário foi selecionado
                    const event = new CustomEvent('autocomplete:selected', {
                        detail: {
                            field: input.attr('name'),
                            item: proprietario
                        },
                        bubbles: true
                    });
                    input[0].dispatchEvent(event);
                    
                    // Exibe mensagem de sucesso
                    alert('Proprietário cadastrado com sucesso no banco de dados!');
                } else {
                    alert('Erro ao cadastrar proprietário: ' + data.error);
                }
            },
            error: function(xhr, status, error) {
                console.error("Erro ao cadastrar proprietário:", error);
                alert('Erro ao cadastrar proprietário');
            },
            complete: function() {
                // Marca que a submissão foi concluída
                isSubmitting = false;
            }
        });
    });
}

/**
 * Configura o modal de novo fornecedor
 */
function setupNovoFornecedorModal() {
    // Flag para controlar submissão em andamento
    let isSubmitting = false;
    
    // Quando o usuário clica em salvar novo fornecedor
    $(document).on('click', '#btnSalvarNovoFornecedor', function() {
        // Previne múltiplos cliques
        if (isSubmitting) return;
        
        const nome = $('#novoFornecedorNome').val().trim();
        const telefone = $('#novoFornecedorTelefone').val().trim();
        const cpf = $('#novoFornecedorCPF').val().trim();
        const endereco = $('#novoFornecedorEndereco').val().trim();
        
        if (!nome) {
            alert('O nome é obrigatório');
            return;
        }
        
        console.log("Salvando novo fornecedor:", nome);
        
        // Marca que está em processo de submissão
        isSubmitting = true;
        
        // Salva o novo fornecedor por AJAX (usa a mesma API de cliente)
        $.ajax({
            url: '/api/criar-cliente-rapido/',
            method: 'POST',
            data: {
                nome: nome,
                telefone: telefone,
                cpf: cpf,
                endereco: endereco,
                tipo: 'FORNECEDOR',
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(data) {
                if (data.success) {
                    // Fecha o modal
                    var fornecedorModal = bootstrap.Modal.getInstance(document.getElementById('modal_novo_fornecedor'));
                    if (fornecedorModal) {
                        fornecedorModal.hide();
                    }
                    
                    // Limpa o formulário
                    $('#form_novo_fornecedor')[0].reset();
                    
                    // Seleciona o fornecedor recém-criado
                    const fornecedor = data.cliente;
                    
                    // Busca o campo de fornecedor mais recentemente utilizado
                    const input = $('.autocomplete-field[data-type="fornecedor"]').last();
                    const container = input.closest('.autocomplete-container');
                    const idField = container.find('input[name="' + input.attr('name').replace('_text', '') + '"]');
                    
                    console.log("Preenchendo campo com novo fornecedor:", fornecedor);
                    
                    // Preenche o campo com o nome do fornecedor
                    input.val(fornecedor.nome);
                    
                    // Armazena o ID do fornecedor no campo oculto
                    idField.val(fornecedor.id);
                    
                    // Atualiza as informações do fornecedor na página
                    $("#fornecedor_info").html(
                        "<strong>CPF:</strong> " + (fornecedor.cpf || "N/A") + "<br>" +
                        "<strong>Telefone:</strong> " + (fornecedor.telefone || "N/A") + "<br>" +
                        "<strong>Endereço:</strong> " + (fornecedor.endereco || "N/A")
                    );
                    $("#fornecedor_info").show();
                    
                    // Dispara evento para informar que um fornecedor foi selecionado
                    const event = new CustomEvent('autocomplete:selected', {
                        detail: {
                            field: input.attr('name'),
                            item: fornecedor
                        },
                        bubbles: true
                    });
                    input[0].dispatchEvent(event);
                    
                    // Exibe mensagem de sucesso
                    alert('Fornecedor cadastrado com sucesso no banco de dados!');
                } else {
                    alert('Erro ao cadastrar fornecedor: ' + data.error);
                }
            },
            error: function(xhr, status, error) {
                console.error("Erro ao cadastrar fornecedor:", error);
                alert('Erro ao cadastrar fornecedor');
            },
            complete: function() {
                // Marca que a submissão foi concluída
                isSubmitting = false;
            }
        });
    });
}

// Função para exibir informações do cliente
function showClienteInfo(clienteId) {
    $.ajax({
        url: "/api/cliente/" + clienteId + "/",
        dataType: "json",
        success: function(data) {
            // Preencher o campo de contato com o telefone do cliente se estiver vazio
            if (data.telefone && !$("#id_contato").val()) {
                $("#id_contato").val(data.telefone);
            }
            
            // Atualizar o div com as informações do cliente
            $("#cliente_info").html(
                "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                "<strong>Telefone:</strong> " + (data.telefone || "N/A") + "<br>" +
                "<strong>Email:</strong> " + (data.email || "N/A") + "<br>" +
                "<strong>Endereço:</strong> " + (data.endereco || "N/A")
            );
            $("#cliente_info").show();
        }
    });
}

function showMotoInfo(motoId) {
    if (!motoId) return;
    
    $.ajax({
        url: "/api/moto/" + motoId + "/",
        dataType: "json",
        success: function(data) {
            $("#moto_info").html(
                "<strong>Marca:</strong> " + (data.marca || "N/A") + "<br>" +
                "<strong>Modelo:</strong> " + (data.modelo || "N/A") + "<br>" +
                "<strong>Ano:</strong> " + (data.ano || "N/A") + "<br>" +
                "<strong>Placa:</strong> " + (data.placa || "N/A")
            );
            $("#moto_info").show();
            
            // Esconder campo de modelo de interesse se tiver moto selecionada
            $('#modeloInteresseRow').hide();
        },
        error: function() {
            console.error("Erro ao carregar dados da moto:", motoId);
            // Mostrar campo de modelo de interesse se não carregar a moto
            $('#modeloInteresseRow').show();
        }
    });
}

function showProprietarioInfo(proprietarioId) {
    if (!proprietarioId) return;
    
    $.ajax({
        url: "/api/cliente/" + proprietarioId + "/",
        dataType: "json",
        success: function(data) {
            $("#proprietario_info").html(
                "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                "<strong>Telefone:</strong> " + (data.telefone || "N/A") + "<br>" +
                "<strong>Endereço:</strong> " + (data.endereco || "N/A")
            );
            $("#proprietario_info").show();
        },
        error: function() {
            console.error("Erro ao carregar dados do proprietário:", proprietarioId);
        }
    });
}

function showFornecedorInfo(fornecedorId) {
    if (!fornecedorId) return;
    
    $.ajax({
        url: "/api/cliente/" + fornecedorId + "/",
        dataType: "json",
        success: function(data) {
            $("#fornecedor_info").html(
                "<strong>CPF:</strong> " + (data.cpf || "N/A") + "<br>" +
                "<strong>RG:</strong> " + (data.rg || "N/A") + "<br>" +
                "<strong>Telefone:</strong> " + (data.telefone || "N/A") + "<br>" +
                "<strong>Endereço:</strong> " + (data.endereco || "N/A")
            );
            $("#fornecedor_info").show();
        },
        error: function() {
            console.error("Erro ao carregar dados do fornecedor:", fornecedorId);
        }
    });
}