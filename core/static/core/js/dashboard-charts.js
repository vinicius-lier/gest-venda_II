// Gráficos do Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se os elementos existem
    const vendedoresChart = document.getElementById('rankingVendedoresChart');
    const motosChart = document.getElementById('rankingMotosChart');
    
    // Gráfico de Ranking de Vendedores
    if (vendedoresChart) {
        const ctxVendedores = vendedoresChart.getContext('2d');
        
        // Dados do gráfico (serão preenchidos pelo template)
        const rankingVendedoresData = {
            labels: window.rankingVendedoresLabels || [],
            datasets: [{
                label: 'Vendas Realizadas',
                data: window.rankingVendedoresData || [],
                backgroundColor: [
                    'rgba(78, 115, 223, 0.8)',
                    'rgba(28, 200, 138, 0.8)',
                    'rgba(54, 185, 204, 0.8)',
                    'rgba(246, 194, 62, 0.8)',
                    'rgba(231, 74, 59, 0.8)',
                    'rgba(133, 135, 150, 0.8)',
                    'rgba(52, 58, 64, 0.8)',
                    'rgba(108, 117, 125, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(40, 167, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(78, 115, 223, 1)',
                    'rgba(28, 200, 138, 1)',
                    'rgba(54, 185, 204, 1)',
                    'rgba(246, 194, 62, 1)',
                    'rgba(231, 74, 59, 1)',
                    'rgba(133, 135, 150, 1)',
                    'rgba(52, 58, 64, 1)',
                    'rgba(108, 117, 125, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(40, 167, 69, 1)'
                ],
                borderWidth: 1
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        };

        new Chart(ctxVendedores, {
            type: 'bar',
            data: rankingVendedoresData,
            options: chartOptions
        });
    }

    // Gráfico de Ranking de Motos
    if (motosChart) {
        const ctxMotos = motosChart.getContext('2d');
        
        // Dados do gráfico (serão preenchidos pelo template)
        const rankingMotosData = {
            labels: window.rankingMotosLabels || [],
            datasets: [{
                label: 'Vendas',
                data: window.rankingMotosData || [],
                backgroundColor: [
                    'rgba(28, 200, 138, 0.8)',
                    'rgba(78, 115, 223, 0.8)',
                    'rgba(54, 185, 204, 0.8)',
                    'rgba(246, 194, 62, 0.8)',
                    'rgba(231, 74, 59, 0.8)',
                    'rgba(133, 135, 150, 0.8)',
                    'rgba(52, 58, 64, 0.8)',
                    'rgba(108, 117, 125, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(40, 167, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(28, 200, 138, 1)',
                    'rgba(78, 115, 223, 1)',
                    'rgba(54, 185, 204, 1)',
                    'rgba(246, 194, 62, 1)',
                    'rgba(231, 74, 59, 1)',
                    'rgba(133, 135, 150, 1)',
                    'rgba(52, 58, 64, 1)',
                    'rgba(108, 117, 125, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(40, 167, 69, 1)'
                ],
                borderWidth: 1
            }]
        };

        new Chart(ctxMotos, {
            type: 'doughnut',
            data: rankingMotosData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}); 