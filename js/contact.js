(function() {
    'use strict';

    console.log('📬 contact.js carregado');

    // ============================================
    // 1. FUNÇÃO PARA PEGAR TEXTO DO DOM
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    // ============================================
    // 2. INICIALIZAR FORMULÁRIO
    // ============================================
    function initForm() {
        const form = document.getElementById('contact-form');
        const success = document.getElementById('form-success');
        
        if (!form) return;

        form.addEventListener('submit', function(e) {
            // O formsubmit.co já faz o envio
            // Apenas mostramos o sucesso se o envio for bem sucedido
            // O formsubmit.co redireciona, então não precisamos fazer nada aqui
            // Mas podemos mostrar um loading se quisermos
            
            // Salva o texto do botão para depois
            const btn = form.querySelector('.btn-submit');
            const originalText = btn ? btn.textContent : '';
            
            // O formulário vai ser enviado normalmente
            // O formsubmit.co vai redirecionar para a página de sucesso
        });
    }

    // ============================================
    // 3. INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('📬 Inicializando contact...');

        function checkAndInit() {
            const testEl = document.getElementById('hero-title');
            if (testEl && testEl.textContent && testEl.textContent.trim() !== '') {
                console.log('✅ Conteúdo carregado, inicializando contact...');
                initForm();
            } else {
                console.log('⏳ Aguardando content-loader...');
                setTimeout(checkAndInit, 200);
            }
        }
        setTimeout(checkAndInit, 300);
    }

    // ============================================
    // 4. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        // Não precisa fazer nada extra, o content-loader cuida dos textos
    };

    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();