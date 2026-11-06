Projeto Integrador I: Ouro Verde - Sistema de Eventos

Repositório destinado ao desenvolvimento do Projeto Integrador I, focado na criação de uma Landing Page e um sistema de gestão de reservas para o espaço de eventos Ouro Verde.

1. Sobre o Projeto

O Ouro Verde oferece serviços de locação de espaços para eventos (aniversários, casamentos, festas corporativas) e aluguel de produtos (mesas, cadeiras, copos, etc.).

O objetivo deste projeto é otimizar a comunicação entre o cliente e a empresa, permitindo que o usuário visualize os serviços, verifique a disponibilidade de datas e selecione os materiais necessários para o seu evento de forma automatizada.

2. Funcionalidades Principais
- Landing Page: Apresentação institucional dos espaços e serviços disponíveis.
- Catálogo de Materiais: Visualização de itens para locação devidamente categorizados.
- Sistema de Reservas: Escolha de serviço principal, data de agendamento e alocação de materiais extras.
- Gestão de Pagamentos: Controle de parcelamento e status das reservas.

3. Modelagem do Banco de Dados

O sistema utiliza um banco de dados relacional estruturado a partir do seguinte Modelo Entidade-Relacionamento (MER):
- Principais Entidades: Clientes, Reservas, Serviços, Materiais, Categorias e Parcelas.
- Diferenciais Técnicos: Implementação de atributos compostos (endereço), atributos multivalorados (telefones), atributos derivados (valor total da reserva) e entidades fracas (parcelas).

4. Tecnologias e Ferramentas Utilizadas
- Prototipação (UI/UX): Figma.
- Modelagem de Dados: Canva.
- Front-end: HTML5, CSS3, JavaScript.
- Back-end: Java 25, Spring Boot 4 (Spring Web + Spring Data JPA).
- SGBD: PostgreSQL.
- Execução: Docker Compose (banco + backend + frontend).

Como rodar (resumo)

    docker compose up --build

- Site: http://localhost:5500 — Admin: http://localhost:5500/adminHTML/login.html (admin@ouroverde.com / 123456)
- API: http://localhost:8080/api — Swagger: http://localhost:8080/swagger-ui.html

Instruções completas, explicação do código e o passo a passo para implementar novas funcionalidades estão em GUIA_IMPLEMENTACAO.md.
Para publicar na internet de graça (Neon + Render + Netlify), siga o GUIA_DEPLOY.md.

5. Equipe
- Bruna Dantas Uchôa Macedo - [https://github.com/brunadum]
- Eduardo Bezerra Brandão - [https://github.com/eduubrand]
- José Gabriel Bezerra do Nascimento - [https://github.com/gaabvitti]
- Maria Larissa Rodrigues do Nascimento - [https://github.com/larissardr]
- Paulo Henrique Aurélio Fernandes - [https://github.com/paulohenriq7]
- Paulo Vitor Moura Silva - [https://github.com/Paulovitor854]
- Yann Ciríaco Farias - [https://github.com/yanncfarias]
