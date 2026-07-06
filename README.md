# ISARIC South America Hub

Site institucional do ISARIC South America Hub, referência em pesquisa de arboviroses na América do Sul (dengue, zika, chikungunya e febre amarela).

O site apresenta os programas de pesquisa, projetos em andamento, ferramentas analíticas, publicações, notícias e informações de contato do hub.

---

## 📁 Estrutura do Projeto
```
/
├── index.html # Página inicial (Home)
├── pages/
│ ├── programs/ # Páginas de projetos (IPOP, Scalable, Community)
│ │ ├── aria.html
│ │ ├── pocus.html
│ │ ├── mosaic.html
│ │ ├── arc-bridge.html
│ │ ├── vertex.html
│ │ ├── credo.html
│ │ └── fellowship.html
│ ├── resources/ # Páginas de recursos
│ │ ├── learn.html # Aprenda
│ │ └── tools.html # Ferramentas
│ ├── learn-more/ # Páginas "Saiba Mais"
│ │ ├── events.html # Eventos
│ │ └── news.html # Notícias
│ └── about/ # Páginas institucionais
│ ├── team.html # Equipe
│ ├── publications.html # Publicações
│ └── contact.html # Contato
├── css/
│ ├── style.css # Estilos globais (reset, header, footer, variáveis)
│ ├── home.css # Estilos exclusivos da Home
│ ├── components/
│ │ └── dropdown.css # Estilos do menu dropdown
│ ├── programs/ # Estilos dos projetos
│ │ ├── aria.css
│ │ ├── pocus.css
│ │ ├── mosaic.css
│ │ ├── arc-bridge.css
│ │ ├── vertex.css
│ │ ├── credo.css
│ │ └── fellowship.css
│ ├── resources/
│ │ ├── learn.css
│ │ └── tools.css
│ ├── learn-more/
│ │ ├── events.css
│ │ └── news.css
│ └── about/
│ ├── team.css
│ ├── publications.css
│ └── contact.css
├── js/
│ ├── main.js # Funções globais (menu, idioma, rodapé)
│ ├── dropdown.js # Suporte touch para dropdown (mobile)
│ ├── news.js # Componente 1+4 de notícias (Home)
│ ├── publications.js # Busca e filtros (Publicações)
│ └── events.js # Filtros (Eventos)
├── assets/
│ ├── images/ # Fotos e banners
│ └── icons/ # Ícones dos programas e projetos (SVG)
├── admin/ # CMS (Decap CMS) – painel de controle
│ ├── index.html
│ └── config.yml
├── content/
│ └── translations/ # Arquivos de tradução
│ ├── pt.json # Português
│ ├── en.json # Inglês
│ └── es.json # Espanhol
├── .gitignore
└── README.md
```

---

## 🌐 Idiomas

O site detecta automaticamente o idioma do navegador do usuário e exibe o conteúdo em:

- **Português (PT)**
- **Inglês (EN)**
- **Espanhol (ES)**

Os conteúdos (notícias, textos) são armazenados em arquivos JSON com campos para cada idioma. O fallback é o inglês (`en`) caso o idioma do navegador não seja suportado.

---

## 🚀 Tecnologias

- **HTML5** – Estrutura das páginas
- **CSS3** – Estilização (um único arquivo)
- **JavaScript** – Interações e carregamento dinâmico de conteúdo
- **GitHub Pages** – Hospedagem estática
- **Decap CMS** – Editor visual para notícias (em breve)

---

## 📄 Páginas

| Página | Descrição |
|--------|-----------|
| **Home** | Hero, últimas notícias (1+4), projetos em destaque, calendário, mapa, newsletter |
| **Programas** | Cards com IPOP, CREDO, Scalable Analytics – cada um com abas internas para projetos |
| **Aprenda** | Protocolos, guias, frameworks |
| **Tools** | Grid de ferramentas analíticas (RAPID, VERTEX, ARC-BRIDGE, SANAR) |
| **Equipe** | Coordenação e pesquisadores associados |
| **Publicações** | Lista de papers com busca e filtros |
| **Notícias** | Lista completa de notícias |
| **Contato** | E-mail, telefone, endereço, mapa |

---

## 👥 Equipe de Desenvolvimento
- Design: Equipe ISARIC South America Hub
- Desenvolvimento: [Seu nome / equipe técnica]
- Conteúdo: Pesquisadores do hub

📝 Licença
Este projeto está licenciado pela ISARIC South America HUB na licença ???.