// Controle de popup para cadastro rápido de cliente
let debounceTimer;
let isPopupOpen = false;
let clickProcessing = false;

// Função de debounce para evitar múltiplas chamadas
function debounce(func, delay) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(func, delay);
}

// Inicializa eventos do popup de cadastro rápido
document.addEventListener('DOMContentLoaded', function() {
  const popupTriggers = document.querySelectorAll('.cadastro-rapido-trigger, .btn-novo-cliente, #btnNovoCliente');
  const popup = document.getElementById('cadastroRapidoPopup');
  const modalNovoCliente = document.getElementById('modalNovoCliente');
  const modalNovoClienteVenda = document.getElementById('modalNovoClienteVenda');
  
  // Configura os elementos do modal baseado em quais estão disponíveis
  const modalAtivo = modalNovoCliente || modalNovoClienteVenda;
  
  if (!modalAtivo) return;
  
  // Evita que o popup feche quando clicar dentro dele
  if (modalAtivo) {
    modalAtivo.addEventListener('mouseenter', function(e) {
      // Marca que o mouse está sobre o modal
      isPopupOpen = true;
    });
    
    modalAtivo.addEventListener('mouseleave', function(e) {
      // Usa debounce para determinar se o mouse realmente saiu do modal
      debounce(function() {
        isPopupOpen = false;
      }, 100);
    });
  }
  
  // Anexa manipuladores de eventos aos gatilhos
  popupTriggers.forEach(trigger => {
    if (!trigger) return;
    
    trigger.addEventListener('click', function(e) {
      // Previne processamento múltiplo do mesmo clique
      if (clickProcessing) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      clickProcessing = true;
      e.preventDefault();
      e.stopPropagation();
      
      // Abre o modal apropriado
      if (modalNovoClienteVenda) {
        var modal = new bootstrap.Modal(modalNovoClienteVenda);
        modal.show();
      } else if (modalNovoCliente) {
        var modal = new bootstrap.Modal(modalNovoCliente);
        modal.show();
      }
      
      // Habilita novos cliques após um tempo
      setTimeout(function() {
        clickProcessing = false;
      }, 500);
    });
  });
  
  // Configura botões de salvar cliente
  const btnSalvarNovoCliente = document.getElementById('btnSalvarNovoCliente');
  const btnSalvarNovoClienteVenda = document.getElementById('btnSalvarNovoClienteVenda');
  
  if (btnSalvarNovoCliente) {
    configBotaoSalvar(btnSalvarNovoCliente, 'novoClienteNome', 'novoClienteTelefone', 'novoClienteCPF', modalNovoCliente);
  }
  
  if (btnSalvarNovoClienteVenda) {
    configBotaoSalvar(btnSalvarNovoClienteVenda, 'novoClienteNome', 'novoClienteTelefone', 'novoClienteCPF', modalNovoClienteVenda);
  }
  
  // Verificar se há motos com status que impede a venda
  const selectMoto = document.querySelector('select[name="moto"]');
  if (selectMoto) {
    selectMoto.addEventListener('change', function() {
      const motoId = this.value;
      if (motoId) {
        verificarStatusMoto(motoId);
      }
    });
  }
});

// Configurar botão de salvar cliente
function configBotaoSalvar(btnElement, inputNomeId, inputTelefoneId, inputCpfId, modalElement) {
  // Adiciona flag para controlar submissão em andamento
  let isSubmitting = false;
  
  btnElement.addEventListener('click', function() {
    // Previne múltiplos envios simultaneamente
    if (isSubmitting) return;
    
    const nome = document.getElementById(inputNomeId)?.value.trim();
    const telefone = document.getElementById(inputTelefoneId)?.value.trim();
    const cpf = document.getElementById(inputCpfId)?.value.trim();
    
    if (!nome) {
      alert('O nome é obrigatório');
      return;
    }
    
    // Marca que está em processo de submissão
    isSubmitting = true;
    
    // Prepara os dados para envio
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('telefone', telefone);
    formData.append('cpf', cpf);
    
    // Adiciona o token CSRF
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    if (csrfToken) {
      formData.append('csrfmiddlewaretoken', csrfToken);
    }
    
    // Envia os dados para o servidor
    fetch('/api/criar-cliente-rapido/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Fecha o modal
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) modal.hide();
        }
        
        // Limpa o formulário
        document.getElementById(inputNomeId).value = '';
        if (document.getElementById(inputTelefoneId)) document.getElementById(inputTelefoneId).value = '';
        if (document.getElementById(inputCpfId)) document.getElementById(inputCpfId).value = '';
        
        // Adiciona o cliente à interface
        atualizarCamposCliente(data.cliente);
        
        // Exibe mensagem de sucesso
        alert('Cliente cadastrado com sucesso!');
      } else {
        alert('Erro ao cadastrar cliente: ' + (data.error || 'Erro desconhecido'));
      }
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Falha ao processar a requisição.');
    })
    .finally(() => {
      // Marca que a submissão foi concluída
      isSubmitting = false;
    });
  });
}

// Atualiza os campos de cliente na interface
function atualizarCamposCliente(cliente) {
  // Atualiza o campo de seleção de cliente, se existir
  const clienteField = document.querySelector('input[name="cliente"]');
  const clienteIdField = document.querySelector('input[name="cliente_id"]');
  const nomeClienteField = document.querySelector('input[name="nome_cliente"]');
  const clienteStatus = document.getElementById('clienteStatus');
  
  if (clienteField) {
    clienteField.value = cliente.text || cliente.nome;
    
    if (clienteIdField) {
      clienteIdField.value = cliente.id;
    }
    
    if (nomeClienteField) {
      nomeClienteField.value = cliente.nome;
    }
    
    if (clienteStatus) {
      clienteStatus.innerHTML = '<span class="text-success">✓ Cliente cadastrado selecionado</span>';
    }
  }
  
  // Preenche também o campo proprietário se estiver vazio
  const proprietarioField = document.querySelector('input[name="proprietario"]');
  const proprietarioIdField = document.querySelector('input[name="proprietario_id"]');
  
  if (proprietarioField && !proprietarioField.value) {
    proprietarioField.value = cliente.text || cliente.nome;
    
    if (proprietarioIdField) {
      proprietarioIdField.value = cliente.id;
    }
  }
  
  // Não preencher o campo contato automaticamente
}

// Verifica se a moto está disponível para venda
function verificarStatusMoto(motoId) {
  fetch(`/api/moto/${motoId}/`)
    .then(response => response.json())
    .then(data => {
      // Verifica o status da moto
      if (data.status && (data.status === 'PENDENCIA' || data.status === 'OFICINA' || data.status === 'MANUTENCAO')) {
        alert(`Atenção: Esta moto está com status ${data.status} e não pode ser vendida até que seu status seja alterado para DISPONIVEL.`);
        
        // Limpa a seleção de moto
        const selectMoto = document.querySelector('select[name="moto"]');
        if (selectMoto) {
          selectMoto.value = '';
        }
      } else if (data.proprietario) {
        // Se a moto tem proprietário, pergunta se deve preencher os campos
        const confirmarProprietario = confirm(`Esta moto pertence a ${data.proprietario.nome}. Deseja preencher os campos de proprietário e fornecedor com esses dados?`);
        
        if (confirmarProprietario) {
          // Preenche o campo proprietário
          const proprietarioField = document.querySelector('input[name="proprietario"]');
          const proprietarioIdField = document.querySelector('input[name="proprietario_id"]');
          
          if (proprietarioField) {
            proprietarioField.value = data.proprietario.text || data.proprietario.nome;
            
            if (proprietarioIdField) {
              proprietarioIdField.value = data.proprietario.id;
            }
          }
          
          // Preenche o campo fornecedor
          const fornecedorField = document.querySelector('input[name="fornecedor"]');
          const fornecedorIdField = document.querySelector('input[name="fornecedor_id"]');
          
          if (fornecedorField) {
            fornecedorField.value = data.proprietario.text || data.proprietario.nome;
            
            if (fornecedorIdField) {
              fornecedorIdField.value = data.proprietario.id;
            }
          }
        }
        
        // Se tiver valor, preenche o campo valor_venda
        if (data.valor) {
          const valorVendaField = document.querySelector('input[name="valor_venda"]');
          if (valorVendaField && !valorVendaField.value) {
            valorVendaField.value = data.valor;
          }
        }
      }
    })
    .catch(error => {
      console.error('Erro ao verificar status da moto:', error);
    });
} 