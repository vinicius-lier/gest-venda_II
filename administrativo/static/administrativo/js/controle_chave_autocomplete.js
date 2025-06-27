document.addEventListener('DOMContentLoaded', function() {
    function preencherCampos(moto) {
        if (moto) {
            document.getElementById('id_id_moto').value = moto.id;
            document.getElementById('id_placa_moto').value = moto.placa || '';
            document.getElementById('id_chassi_moto').value = moto.chassi || '';
            // Seleciona a moto no select
            let select = document.getElementById('id_motocicleta');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value == moto.id) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }
    function buscarMoto(params) {
        fetch('/ajax/buscar-motocicleta/?' + new URLSearchParams(params))
            .then(resp => resp.ok ? resp.json() : null)
            .then(data => {
                if (data) preencherCampos(data);
            });
    }
    document.getElementById('id_id_moto').addEventListener('change', function() {
        let val = this.value;
        if (val) buscarMoto({id_moto: val});
    });
    document.getElementById('id_placa_moto').addEventListener('change', function() {
        let val = this.value;
        if (val) buscarMoto({placa: val});
    });
    document.getElementById('id_chassi_moto').addEventListener('change', function() {
        let val = this.value;
        if (val) buscarMoto({chassi: val});
    });
}); 