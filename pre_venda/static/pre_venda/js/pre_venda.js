/**
 * JavaScript para o módulo de Pré-Venda
 */

// Máscara para telefone
function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
            if (value.length <= 2) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length <= 10) {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
            } else {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
        }
        
        e.target.value = value;
    });
}

// Buscar pré-venda por telefone
function buscarPreVendaPorTelefone(telefone, callback) {
    if (telefone.length >= 10) {
        fetch(`/pre-venda/api/buscar-pre-venda/?telefone=${encodeURIComponent(telefone)}`)
            .then(response => response.json())
            .then(data => {
                if (callback) {
                    callback(data);
                }
            })
            .catch(error => {
                console.error('Erro ao buscar pré-venda:', error);
            });
    }
}

// Formatar valor monetário
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Atualizar KPIs em tempo real
function atualizarKPIs() {
    fetch('/pre-venda/api/kpis/')
        .then(response => response.json())
        .then(data => {
            // Atualizar elementos na página se existirem
            const elementos = {
                'total-pre-vendas': data.total_pre_vendas,
                'vendas-convertidas': data.total_vendas_convertidas,
                'pre-vendas-abertas': data.total_vendas_abertas,
                'taxa-conversao': data.taxa_conversao + '%'
            };
            
            Object.keys(elementos).forEach(id => {
                const elemento = document.getElementById(id);
                if (elemento) {
                    elemento.textContent = elementos[id];
                }
            });
        })
        .catch(error => {
            console.error('Erro ao atualizar KPIs:', error);
        });
}

// Inicializar funcionalidades quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar máscara de telefone em todos os campos de telefone
    const telefoneInputs = document.querySelectorAll('input[name*="telefone"]');
    telefoneInputs.forEach(aplicarMascaraTelefone);
    
    // Auto-completar campos de venda baseado na pré-venda
    const telefoneVendaInput = document.querySelector('#id_telefone');
    if (telefoneVendaInput) {
        telefoneVendaInput.addEventListener('blur', function() {
            buscarPreVendaPorTelefone(this.value, function(data) {
                if (data.resultados && data.resultados.length > 0) {
                    const preVenda = data.resultados[0];
                    const preVendaSugeridaInput = document.querySelector('#id_pre_venda_sugerida');
                    const nomeCompletoInput = document.querySelector('#id_nome_completo');
                    const motoVendidaInput = document.querySelector('#id_moto_vendida');
                    
                    if (preVendaSugeridaInput) {
                        preVendaSugeridaInput.value = `${preVenda.nome_cliente} - ${preVenda.moto_desejada} (${preVenda.data_atendimento})`;
                    }
                    
                    if (nomeCompletoInput) {
                        nomeCompletoInput.value = preVenda.nome_cliente;
                    }
                    
                    if (motoVendidaInput) {
                        motoVendidaInput.value = preVenda.moto_desejada;
                    }
                }
            });
        });
    }
    
    // Atualizar KPIs a cada 30 segundos se estiver no dashboard
    if (window.location.pathname === '/pre-venda/') {
        setInterval(atualizarKPIs, 30000);
    }
    
    // Filtros da lista de pré-vendas
    const filtros = document.querySelectorAll('select[name="status"], select[name="vendedor"]');
    filtros.forEach(filtro => {
        filtro.addEventListener('change', function() {
            this.closest('form').submit();
        });
    });
    
    // Busca em tempo real
    const buscaInput = document.querySelector('input[name="search"]');
    if (buscaInput) {
        let timeoutId;
        buscaInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.closest('form').submit();
            }, 500);
        });
    }
});

// Funções utilitárias
window.PreVendaUtils = {
    aplicarMascaraTelefone,
    buscarPreVendaPorTelefone,
    formatarMoeda,
    atualizarKPIs
}; 