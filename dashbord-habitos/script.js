const botoes = document.querySelectorAll('.habit-btn');
const barraProgresso = document.getElementById('progressBar');
const botaoReset = document.getElementById('reset-btn');

let habitos = JSON.parse(localStorage.getItem('meusHabitos')) || {};

function atualizarProgresso() {
    const total = botoes.length;
    const concluidos = Object.values(habitos).filter(status => status === true).length;
    
    const porcentagem = (concluidos / total) * 100;
    barraProgresso.style.width = `${porcentagem}%`;
}

botoes.forEach(botao => {
    const nomeHabito = botao.getAttribute('data-habit');

    if (habitos[nomeHabito]) {
        botao.classList.add('completed');
    }

    botao.addEventListener('click', () => {
        // Efeitozinho vibratório no celular se tiver suporte!
        if (navigator.vibrate) navigator.vibrate(50);
        
        botao.classList.toggle('completed');
        habitos[nomeHabito] = botao.classList.contains('completed');
        localStorage.setItem('meusHabitos', JSON.stringify(habitos));
        atualizarProgresso();
    });
});

function zerarHabitos() {
    habitos = {};
    localStorage.removeItem('meusHabitos');
    botoes.forEach(botao => {
        botao.classList.remove('completed');
    });
    atualizarProgresso();
}

botaoReset.addEventListener('click', () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    zerarHabitos();
    localStorage.setItem('ultimoReset', Date.now());
});

function checarResetAutomatico() {
    const ultimoReset = localStorage.getItem('ultimoReset');
    
    if (ultimoReset) {
        const agora = Date.now();
        const tempoPassado = agora - parseInt(ultimoReset);
        const vinteEQuatroHoras = 24 * 60 * 60 * 1000;
        
        if (tempoPassado >= vinteEQuatroHoras) {
            zerarHabitos();
            localStorage.setItem('ultimoReset', agora);
        }
    }
}

checarResetAutomatico();
atualizarProgresso();

// === LÓGICA DO BOTÃO DE INSTALAÇÃO (PWA) ===
let eventoInstalacao;
const botaoInstalar = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoInstalacao = evento;
    botaoInstalar.style.display = 'block';
});

botaoInstalar.addEventListener('click', async () => {
    if (!eventoInstalacao) return;

    eventoInstalacao.prompt();

    const resultado = await eventoInstalacao.userChoice;
    if (resultado.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        botaoInstalar.style.display = 'none';
    } else {
        console.log('Usuário recusou a instalação');
    }

    eventoInstalacao = null;
});

window.addEventListener('appinstalled', () => {
    botaoInstalar.style.display = 'none';
    console.log('PWA já instalado.');
});

// Registra o Service Worker para transformar em PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('App instalado com sucesso!', reg))
            .catch(erro => console.log('Falha ao instalar o app', erro));
    });
}