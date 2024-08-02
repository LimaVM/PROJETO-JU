const apiBaseUrl = 'http://192.168.1.120:7770';

// Carregar funcionários ao iniciar na página principal
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('buscar-funcionario')) {
        carregarFuncionarios();
        if (document.getElementById('status')) {
            document.getElementById('status').addEventListener('change', toggleCampos);
        }
    }
    if (document.getElementById('form-registro-funcionario')) {
        configurarRegistroFuncionario();
    }
    if (document.getElementById('form-exportar')) {
        configurarExportacao();
    }
});

// Função para configurar o registro de funcionário
function configurarRegistroFuncionario() {
    document.getElementById('form-registro-funcionario').addEventListener('submit', function(event) {
        event.preventDefault();
        const nome = document.getElementById('novo-funcionario').value.trim();
        if (nome) {
            fetch(`${apiBaseUrl}/funcionarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome })
            })
            .then(response => response.json())
            .then(data => {
                alert(`Funcionário ${nome} registrado com sucesso!`);
                document.getElementById('novo-funcionario').value = '';
            })
            .catch(error => console.error('Erro ao registrar funcionário:', error));
        } else {
            alert('Por favor, insira o nome do funcionário.');
        }
    });
}

// Função para configurar exportação para Excel
function configurarExportacao() {
    document.getElementById('exportar').addEventListener('click', function() {
        const funcionarioId = document.getElementById('buscar-funcionario').value;
        const inicio = document.getElementById('inicio').value;
        const fim = document.getElementById('fim').value;
        const todos = document.getElementById('todos-dias').checked;

        fetch(`${apiBaseUrl}/exportar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ funcionario_id: funcionarioId, inicio, fim, todos })
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'presencas.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Erro ao exportar dados:', error));
    });
}

// Função para carregar funcionários no dropdown
function carregarFuncionarios() {
    fetch(`${apiBaseUrl}/funcionarios`)
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('buscar-funcionario');
            select.innerHTML = '';
            data.forEach(funcionario => {
                const option = document.createElement('option');
                option.value = funcionario.id;
                option.textContent = funcionario.nome;
                select.appendChild(option);
            });

            // Carregar presenças e saldo extra do primeiro funcionário por padrão
            if (data.length > 0 && document.getElementById('registros')) {
                carregarPresencas(data[0].id);
                carregarSaldoExtra(data[0].id);
            }
        })
        .catch(error => console.error('Erro ao carregar funcionários:', error));
}

// Alternar campos de horário com base no status de presença
function toggleCampos() {
    const status = document.getElementById('status').value;
    const campos = ['entrada_manha', 'saida_manha', 'entrada_tarde', 'saida_tarde'];
    
    campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (status === 'Ausente') {
            campo.value = ''; // Limpar o campo
            campo.disabled = true; // Desativar o campo
        } else {
            campo.disabled = false; // Ativar o campo
        }
    });
}

// Evento para registrar presença
if (document.getElementById('form-registro-presenca')) {
    document.getElementById('form-registro-presenca').addEventListener('submit', function(event) {
        event.preventDefault();
        const funcionarioId = document.getElementById('buscar-funcionario').value;
        const data = document.getElementById('data').value;
        const status = document.getElementById('status').value;

        // Substituir horários por "AUSENTE" se o status for "Ausente"
        const entradaManha = status === 'Ausente' ? 'AUSENTE' : document.getElementById('entrada_manha').value;
        const saidaManha = status === 'Ausente' ? 'AUSENTE' : document.getElementById('saida_manha').value;
        const entradaTarde = status === 'Ausente' ? 'AUSENTE' : document.getElementById('entrada_tarde').value;
        const saidaTarde = status === 'Ausente' ? 'AUSENTE' : document.getElementById('saida_tarde').value;

        fetch(`${apiBaseUrl}/presencas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ funcionario_id: funcionarioId, data, entrada_manha: entradaManha, saida_manha: saidaManha, entrada_tarde: entradaTarde, saida_tarde: saidaTarde, status })
        })
        .then(response => response.json())
        .then(data => {
            alert('Presença registrada com sucesso!');
            carregarPresencas(funcionarioId);
            carregarSaldoExtra(funcionarioId);
        })
        .catch(error => console.error('Erro ao registrar presença:', error));
    });
}

// Carregar presenças de um funcionário
function carregarPresencas(funcionarioId) {
    fetch(`${apiBaseUrl}/presencas/${funcionarioId}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('registros');
            tbody.innerHTML = '';
            data.forEach(presenca => {
                const ausenteClass = presenca.status === 'Ausente' ? 'ausente' : '';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${presenca.data}</td>
                    <td class="${ausenteClass}">${presenca.entrada_manha}</td>
                    <td class="${ausenteClass}">${presenca.saida_manha}</td>
                    <td class="${ausenteClass}">${presenca.entrada_tarde}</td>
                    <td class="${ausenteClass}">${presenca.saida_tarde}</td>
                    <td class="${ausenteClass}">${presenca.status}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Erro ao carregar presenças:', error));
}

// Carregar saldo extra de um funcionário
function carregarSaldoExtra(funcionarioId) {
    fetch(`${apiBaseUrl}/funcionarios`)
        .then(response => response.json())
        .then(data => {
            const funcionario = data.find(f => f.id == funcionarioId);
            const saldoExtraDiv = document.getElementById('saldo-extra');
            saldoExtraDiv.textContent = `R$${funcionario.saldo_extra.toFixed(2)}`;
        })
        .catch(error => console.error('Erro ao carregar saldo extra:', error));
}

// Atualizar presenças e saldo extra quando um funcionário é selecionado
if (document.getElementById('buscar-funcionario')) {
    document.getElementById('buscar-funcionario').addEventListener('change', function() {
        const funcionarioId = this.value;
        carregarPresencas(funcionarioId);
        carregarSaldoExtra(funcionarioId);
    });
}
