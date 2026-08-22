// ============================================
// DASHBOARD ARIA – VERSÃO FINAL CORRIGIDA
// ============================================
(function() {
    'use strict';

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLyxp9nEhPf9JNI-7tblAH53d8aj4yxKg6OYXK_kuEhQu3PpYKY0ETITjrmBnCA1KpkCCQZEU2Lygj/pub?gid=0&single=true&output=csv';

    // ============================================
    // 1. BUSCAR CSV
    // ============================================
    async function fetchCSV() {
        try {
            console.log('🔄 Buscando CSV...');
            const response = await fetch(CSV_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const csvText = await response.text();
            console.log('✅ CSV carregado.');
            return csvText;
        } catch (error) {
            console.error('❌ Erro:', error);
            return null;
        }
    }

    // ============================================
    // 2. CONVERTER CSV EM OBJETOS
    // ============================================
    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        console.log('📋 Cabeçalhos:', headers);

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            if (!values[0] || values[0].trim() === '') continue;
            
            const obj = {};
            headers.forEach((h, idx) => { 
                obj[h] = values[idx] || ''; 
            });
            data.push(obj);
        }

        console.log(`📊 ${data.length} linhas de dados`);
        return data;
    }

    // ============================================
    // 3. NORMALIZAR STATUS (ORDEM CORRETA)
    // ============================================
    function normalizeStatus(rawStatus) {
        if (!rawStatus) return 'notReady';
        
        const lowerStatus = rawStatus.toLowerCase();
        
        // Ordem: mais específico primeiro
        if (lowerStatus.includes('preparation') || rawStatus.includes('🟠')) {
            return 'preparation';
        }
        if (lowerStatus.includes('nearly') || rawStatus.includes('🟡')) {
            return 'nearly';
        }
        if (lowerStatus.includes('not ready') || rawStatus.includes('🔴')) {
            return 'notReady';
        }
        if (lowerStatus.includes('ready') || rawStatus.includes('✅')) {
            return 'ready';
        }
        
        console.warn(`⚠️ Status não reconhecido: "${rawStatus}" → fallback "notReady"`);
        return 'notReady';
    }

    // ============================================
    // 4. EXTRAIR DADOS
    // ============================================
    function extractDashboardData(data) {
        if (!data || data.length === 0) return null;

        const allKeys = Object.keys(data[0]);
        console.log('🔍 Colunas disponíveis:', allKeys);

        const countryKey = allKeys.find(k => k === 'Country') || allKeys[1];
        const readinessKey = allKeys.find(k => k === 'Operational readiness');

        console.log('🔍 País (Country):', countryKey);
        console.log('🔍 Status (Operational readiness):', readinessKey);

        if (!readinessKey) {
            console.error('❌ Coluna "Operational readiness" não encontrada!');
            return null;
        }

        console.log(`📋 VALORES DA COLUNA "${readinessKey}":`);
        data.slice(0, 10).forEach((row, i) => {
            console.log(`  ${i+1}: "${row[readinessKey] || '(vazio)'}"`);
        });

        let ready = 0, nearlyReady = 0, preparation = 0, notReady = 0;
        const countryCount = {};

        data.forEach((row, index) => {
            const country = (row[countryKey] || '').trim();
            const rawStatus = (row[readinessKey] || '').trim();
            
            const status = normalizeStatus(rawStatus);

            // Log para diagnóstico (primeiros 10)
            if (index < 10) {
                console.log(`🔍 [${index}] "${rawStatus}" → "${status}"`);
            }

            switch(status) {
                case 'ready': ready++; break;
                case 'nearly': nearlyReady++; break;
                case 'preparation': preparation++; break;
                default: notReady++; break;
            }

            if (country) {
                const normalizedCountry = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
                countryCount[normalizedCountry] = (countryCount[normalizedCountry] || 0) + 1;
            }
        });

        const totalSites = data.length;

        let countries = Object.keys(countryCount).map(c => ({
            country: c,
            count: countryCount[c]
        }));
        countries.sort((a, b) => b.count - a.count);

        let finalCountries = countries;
        if (countries.length > 10) {
            const top10 = countries.slice(0, 10);
            const othersCount = countries.slice(10).reduce((sum, item) => sum + item.count, 0);
            finalCountries = othersCount > 0 ? [...top10, { country: 'Others', count: othersCount }] : top10;
        }

        const result = {
            totalSites,
            siteStatus: { ready, nearlyReady, preparation, notReady },
            countries: finalCountries
        };

        console.log('📊 RESULTADO FINAL:', result);
        return result;
    }

    // ============================================
    // 5. ATUALIZAR HERO CARD
    // ============================================
    function updateHeroCard(data) {
        const heroCard = document.querySelector('.hero-card');
        if (!heroCard) {
            console.warn('⚠️ Hero card não encontrado');
            return;
        }

        console.log('🔄 Atualizando Hero Card...');
        heroCard.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'hero-card-main-title';
        title.textContent = 'ARIA Study Progress';
        title.style.cssText = `
            font-family: var(--font-inter);
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--isaric-gold);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 10px;
        `;
        heroCard.appendChild(title);

        const totalDiv = document.createElement('div');
        totalDiv.className = 'hero-card-stat';
        totalDiv.innerHTML = `
            <div class="stat-number">${data.totalSites}</div>
            <div class="stat-label">Total de Sites</div>
        `;
        heroCard.appendChild(totalDiv);

        const statusGrid = document.createElement('div');
        statusGrid.className = 'status-grid';
        statusGrid.innerHTML = `
            <div class="status-item ready"><span>${data.siteStatus.ready}</span> Ready</div>
            <div class="status-item nearly"><span>${data.siteStatus.nearlyReady}</span> Nearly Ready</div>
            <div class="status-item prep"><span>${data.siteStatus.preparation}</span> Preparation Needed</div>
            <div class="status-item not"><span>${data.siteStatus.notReady}</span> Not Ready</div>
        `;
        heroCard.appendChild(statusGrid);

        if (data.countries && data.countries.length > 0) {
            const countriesDiv = document.createElement('div');
            countriesDiv.className = 'hero-card-countries';
            const countriesTitle = document.createElement('div');
            countriesTitle.className = 'hero-card-title';
            countriesTitle.textContent = 'Sites by Country';
            countriesDiv.appendChild(countriesTitle);

            const maxCount = data.countries[0]?.count || 1;

            data.countries.forEach(item => {
                const pct = (item.count / maxCount) * 100;
                const bar = document.createElement('div');
                bar.className = 'site-bar';
                const isOthers = item.country === 'Others';
                const barColor = isOthers ? '#888' : 'var(--isaric-gold)';
                bar.innerHTML = `
                    <div class="site-bar-header">
                        <span class="country" style="${isOthers ? 'color: #888;' : ''}">${item.country}</span>
                        <span class="pct">${item.count}</span>
                    </div>
                    <div class="site-bar-track">
                        <div class="site-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
                    </div>
                `;
                countriesDiv.appendChild(bar);
            });

            heroCard.appendChild(countriesDiv);
        }

        console.log('✅ Hero Card atualizado!');
    }

    // ============================================
    // 6. LOAD
    // ============================================
    async function loadDashboard() {
        console.log('🔄 Carregando dashboard...');

        const csvText = await fetchCSV();
        if (!csvText) {
            showError();
            return;
        }

        const rawData = parseCSV(csvText);
        if (!rawData || rawData.length === 0) {
            showError();
            return;
        }

        const data = extractDashboardData(rawData);
        if (!data || data.totalSites === 0) {
            showError();
            return;
        }

        updateHeroCard(data);
        console.log('✅ Dashboard carregado!');
    }

    function showError() {
        const heroCard = document.querySelector('.hero-card');
        if (heroCard) {
            heroCard.innerHTML = `
                <div style="text-align:center; padding:20px; color: rgba(255,255,255,0.6);">
                    <p>📊 Dados indisponíveis</p>
                    <p style="font-size:0.7rem;">Tente novamente mais tarde.</p>
                </div>
            `;
        }
    }

    // ============================================
    // 7. INICIALIZAÇÃO
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDashboard);
    } else {
        loadDashboard();
    }

})();