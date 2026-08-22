# ISARIC South America Hub

Institutional website of the ISARIC South America Hub, a reference in arbovirus research in South America (dengue, zika, chikungunya, and yellow fever).

The website presents research programs, ongoing projects, analytical tools, publications, news, and hub contact information.

---

## 📁 Project Structure
```
/
├── .gitignore
├── index.html
├── license
├── README.md
│   
├───adm
│   └─── config.yml
│       
├───assets
│   ├─── icons
│   ├─── images
│   ├─── news
│   └─── people
│           
├───content
│   ├─── clinical.json
│   ├─── common.json
│   ├─── contact.json
│   ├─── dashboard.json
│   ├─── team.json
│   ├─── tools.json
│   ├─── training.json
│   │   
│   └───newspages
│           └─── *.md (news content)
├───css
│   ├─── home.css
│   ├─── style.css
│   └─── pages
│        ├─── clinical.css
│        ├─── contact.css
│        ├─── dashboard.css
│        ├─── news.css
│        ├─── publications.css
│        ├─── team.css
│        ├─── tools.css
│        └─── training.css
│      
├───js
│    ├─── main.js
│    ├─── map.js
│    ├─── news.js
│    └─── publications.js
│           
└───pages
    ├─── clinical.html
    ├─── contact.html
    ├─── dashboard.html
    ├─── news.html
    ├─── publications.html
    ├─── team.html
    ├─── tools.html
    ├─── training.html
    └─── newspages
        ├─── aria-2026.html
        ├─── credo-2026.html
        ├─── fellowship-2026.html
        ├─── ifors-2026.html
        └─── paper-2026.html
```

---

## 🌐 Languages

The website automatically detects the user's browser language and displays content in:

- **Portuguese (PT)**
- **English (EN)**
- **Spanish (ES)**

Content (news, texts) is stored in JSON files with fields for each language. The fallback language is English (`en`) if the browser language is not supported.

---

## 🚀 Technologies

- **HTML5** – Page structure
- **CSS3** – Styling (separate files per page)
- **JavaScript** – Interactions and dynamic content loading
- **GitHub Pages** – Static hosting
- **Decap CMS** – Visual editor for news

---

## 📄 Pages

| Page | Description |
|------|-------------|
| **Home** | Hero, latest news (1+4), hub introduction, newsletter |
| **Clinical Research** | Tabs: ARIA, MOSAIC, POCUS, Chikungunya |
| **Training** | Tabs: CREDO, Fellowship |
| **Tools** | Tools, protocols, publications |
| **Dashboard** | VERTEX Dashboard + Command Tower (2-column grid) |
| **Publications** | Papers list with search and filters |
| **News** | Complete news list |
| **Team** | Coordination and associated researchers |
| **Contact Us** | Address, email, and contact form |

---

## 👥 Development Team

- **Design:** ISARIC South America Hub Team
- **Development:** Carlos Lima | Luiz Raffaini | David Benech
- **Content:** Josephine Bourner | Leonardo Bastos

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

© 2026-2028 ISARIC South America Hub