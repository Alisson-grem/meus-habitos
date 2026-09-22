const botoes = document.querySelectorAll('.habit-btn');
const barraProgresso = document.getElementById('progressBar');
const botaoReset = document.getElementById('reset-btn');
const botaoNotificacao = document.getElementById('notify-btn');

let habitos = JSON.parse(localStorage.getItem('meusHabitos')) || {};
let notificouHoje = localStorage.getItem('notificouHoje') === 'true';

// === MAGIA DO MODO ESCURO ===
let isDark = localStorage.getItem('darkMode') === 'true';
const themeBtnPC = document.getElementById('theme-btn-pc');
const themeBtnMobile = document.getElementById('theme-btn-mobile');

function aplicarTema() {
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeBtnPC.innerText = '☀️';
        themeBtnMobile.querySelector('.icon').innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeBtnPC.innerText = '🌙';
        themeBtnMobile.querySelector('.icon').innerText = '🌙';
    }
}
aplicarTema();

function alternarTema() {
    isDark = !isDark;
    localStorage.setItem('darkMode', isDark);
    aplicarTema();
}
themeBtnPC.addEventListener('click', alternarTema);
themeBtnMobile.addEventListener('click', alternarTema);


// === BOTÕES "EM BREVE" DA SIPAH ===
const alertaSipah = () => alert("Hmph! Sipah ainda vai construir essa tela! Segura a emoção aí, humaninho!");

document.getElementById('settings-btn-pc').addEventListener('click', alertaSipah);
document.getElementById('stats-btn-pc').addEventListener('click', alertaSipah);
document.getElementById('settings-btn-mobile').addEventListener('click', alertaSipah);
document.getElementById('stats-btn-mobile').addEventListener('click', alertaSipah);


// === NOTIFICAÇÕES ===
if (!("Notification" in window) || Notification.permission === 'granted' || Notification.permission === 'denied') {
    botaoNotificacao.style.display = 'none';
}

botaoNotificacao.addEventListener('click', () => {
    Notification.requestPermission().then(permissao => {
        if (permissao === 'granted') {
            botaoNotificacao.style.display = 'none';
            new Notification("Hmph!", {
                body: "Sipah tá de olho nos seus hábitos agora!",
                icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
            });
        }
    });
});

function enviarNotificacaoParabens() {
    if ("Notification" in window && Notification.permission === "granted" && !notificouHoje) {
        new Notification("✨ Uhuu! Trabalho feito!", {
            body: "Você completou todos os mini-hábitos de hoje. Sipah tá orgulhosa!",
            icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
        });
        notificouHoje = true;
        localStorage.setItem('notificouHoje', 'true');
    }
}

// === PROGRESSO E HÁBITOS ===
function atualizarProgresso() {
    const total = botoes.length;
    const concluidos = Object.values(habitos).filter(status => status === true).length;
    
    const porcentagem = (concluidos / total) * 100;
    barraProgresso.style.width = `${porcentagem}%`;

    if (porcentagem === 100) {
        enviarNotificacaoParabens();
    }
}

botoes.forEach(botao => {
    const nomeHabito = botao.getAttribute('data-habit');

    if (habitos[nomeHabito]) {
        botao.classList.add('completed');
    }

    botao.addEventListener('click', () => {
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
    
    notificouHoje = false;
    localStorage.removeItem('notificouHoje');

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

// === LÓGICA DO BOTÃO INVISÍVEL DE INSTALAÇÃO (PWA) ===
let eventoInstalacao;
const botaoInstalarIcone = document.getElementById('install-icon-btn');

window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoInstalacao = evento;
    // O botão aparece lá na barrinha de baixo!
    botaoInstalarIcone.style.display = 'inline-block';
});

botaoInstalarIcone.addEventListener('click', async () => {
    if (!eventoInstalacao) return;

    eventoInstalacao.prompt();

    const resultado = await eventoInstalacao.userChoice;
    if (resultado.outcome === 'accepted') {
        botaoInstalarIcone.style.display = 'none';
    }

    eventoInstalacao = null;
});

window.addEventListener('appinstalled', () => {
    botaoInstalarIcone.style.display = 'none';
});

// Registra o Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(erro => console.log('Falha no ajudante', erro));
    });
}