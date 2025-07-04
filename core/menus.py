# Estrutura central de menus do sistema
MENUS = [
    {
        "label": "Dashboard",
        "url": "core:dashboard",
        "icon": "bi-house",
        "perms": ["core.view_dashboard"],
    },
    {
        "label": "Clientes",
        "url": "core:cliente_list",
        "icon": "bi-people",
        "perms": ["core.view_cliente"],
    },
    {
        "label": "Motocicletas",
        "url": "core:motocicleta_list",
        "icon": "bi-bicycle",
        "perms": ["core.view_motocicleta"],
    },
    {
        "label": "Vendas",
        "url": "core:venda_list",
        "icon": "bi-cash-coin",
        "perms": ["core.view_venda"],
        "submenus": [
            {
                "label": "Lista de Vendas",
                "url": "core:venda_list",
                "perms": ["core.view_venda"],
                "submenus": [
                    {
                        "label": "Nova Venda",
                        "url": "core:venda_create",
                        "perms": ["core.add_venda"],
                    },
                ]
            },
            {
                "label": "Consignações",
                "url": "core:consignacao_list",
                "perms": ["core.view_consignacao"],
                "submenus": [
                    {
                        "label": "Nova Consignação",
                        "url": "core:consignacao_create",
                        "perms": ["core.add_consignacao"],
                    },
                ]
            },
            {
                "label": "Pré-Venda",
                "url": "pre_venda:lista_pre_vendas",
                "perms": ["pre_venda.view_prevenda"],
            },
        ]
    },
    {
        "label": "Seguros",
        "icon": "bi-shield-check",
        "perms": ["core.view_seguro"],
        "submenus": [
            {
                "label": "Seguradoras",
                "url": "core:seguradora_list",
                "perms": ["core.view_seguradora"],
            },
            {
                "label": "Bens",
                "url": "core:bem_list",
                "perms": ["core.view_bem"],
            },
            {
                "label": "Cotações",
                "url": "core:cotacao_seguro_list",
                "perms": ["core.view_cotacaoseguro"],
            },
            {
                "label": "Planos de Seguro",
                "url": "core:plano_seguro_list",
                "perms": ["core.view_planoseguro"],
            },
            {
                "label": "Seguros",
                "url": "core:seguro_list",
                "perms": ["core.view_seguro"],
            },
        ]
    },
    {
        "label": "Financeiro",
        "icon": "bi-cash-stack",
        "perms": ["core.view_despesa"],
        "submenus": [
            {
                "label": "Despesas",
                "url": "core:despesa_list",
                "perms": ["core.view_despesa"],
            },
            {
                "label": "Receitas Extras",
                "url": "core:receita_extra_list",
                "perms": ["core.view_receitaextra"],
            },
            {
                "label": "Pagamentos",
                "url": "core:pagamento_list",
                "perms": ["core.view_pagamento"],
            },
        ]
    },
    {
        "label": "Administrativo",
        "icon": "bi-gear",
        "perms": ["administrativo.view_menu"],
        "submenus": [
            {
                "label": "Controle de Chaves",
                "url": "administrativo:controle_chave_list",
                "perms": ["administrativo.view_controlechave"],
            },
            {
                "label": "Documentos",
                "url": "core:documento_motocicleta_list",
                "perms": ["core.view_documentomotocicleta"],
            },
            {
                "label": "Usuários",
                "url": "core:usuario_list",
                "perms": ["core.view_usuario"],
            },
            {
                "label": "Lojas",
                "url": "core:loja_list",
                "perms": ["core.view_loja"],
            },
            {
                "label": "Importar Dados",
                "url": "core:import_data",
                "perms": ["core.importar_dados"],
            },
        ]
    },
    # Adicione outros menus conforme necessário
] 