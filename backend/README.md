# API do Festão (pasta `backend/`)

Backend em Node + Express + Prisma. Guarda eventos, convidados, presentes e o
marketplace de fornecedores num banco de verdade, para que os dados sejam os
mesmos em qualquer navegador.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
npm run db:push    # cria as tabelas
npm run db:seed    # popula com dados de exemplo
npm run dev        # sobe em http://localhost:4000
```

O front continua igual, em outro terminal:

```bash
npm run dev        # na raiz do projeto, em http://localhost:5173
```

Login de teste depois do seed: **leticia@festao.com** / **123456**
(todos os fornecedores do seed usam a mesma senha).

## Banco de dados

Em desenvolvimento é SQLite, num arquivo `backend/dev.db`. Não precisa instalar
nada e o arquivo está no `.gitignore`.

Para publicar em produção, mude duas coisas:

1. Em `prisma/schema.prisma`, troque `provider = "sqlite"` por `provider = "postgresql"`.
2. No `.env`, aponte `DATABASE_URL` para o Postgres.

Nenhum campo do schema precisa mudar. Por isso não usei `enum` nem `Json` em
lugar nenhum: o SQLite não suporta os dois, e ficar preso a eles atrapalharia
a migração.

Comandos úteis:

- `npm run db:studio` — abre uma interface visual para olhar as tabelas
- `npm run db:reset` — apaga tudo e roda o seed de novo
- `npm test` — smoke test da API inteira, sem precisar de banco

## Variáveis de ambiente

| Variável | Para que serve |
| --- | --- |
| `DATABASE_URL` | Conexão do banco |
| `JWT_SECRET` | Chave que assina os tokens de login. Troque em produção. |
| `PORT` | Porta da API (padrão 4000) |
| `CORS_ORIGIN` | Endereço do front autorizado. Aceita vários, separados por vírgula. |

## Como funciona o login

O cadastro devolve um token JWT válido por 7 dias. O front guarda esse token e
manda em toda requisição no cabeçalho `Authorization: Bearer <token>`.

A senha nunca é guardada em texto puro: fica só o hash gerado pelo bcrypt.

Não existe papel fixo de "admin" ou "fornecedor". Quem cria um evento é o dono
daquele evento e só enxerga os próprios; quem cria um perfil em `/api/vendors`
passa a ser fornecedor também. A mesma pessoa pode ser as duas coisas.

## Endpoints

### Autenticação

| Método | Rota | O que faz |
| --- | --- | --- |
| POST | `/api/auth/register` | Cria conta e já devolve o token |
| POST | `/api/auth/login` | Entra |
| GET | `/api/auth/me` | Dados do usuário logado |
| PATCH | `/api/auth/me` | Atualiza nome e telefone |

### Eventos (precisa estar logado e ser o dono)

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/events` | Lista os meus eventos |
| POST | `/api/events` | Cria evento |
| GET | `/api/events/:id` | Detalhe + resumo de convidados, presentes e orçamento |
| PATCH | `/api/events/:id` | Edita (inclusive `isPublished`) |
| DELETE | `/api/events/:id` | Apaga |
| PATCH | `/api/events/:id/personalization` | Cores, capa, o que aparece na página |
| GET/POST | `/api/events/:id/budget` | Itens de orçamento |
| PATCH/DELETE | `/api/events/:id/budget/:itemId` | Edita ou apaga item |

### Convidados

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/events/:eventId/guests` | Lista, com filtros `?rsvp=` e `?q=` |
| POST | `/api/events/:eventId/guests` | Adiciona um |
| POST | `/api/events/:eventId/guests/import` | Adiciona vários de uma vez, pulando repetidos |
| PATCH | `/api/events/:eventId/guests/:guestId` | Edita |
| POST | `/api/events/:eventId/guests/:guestId/checkin` | Marca presença no dia |
| DELETE | `/api/events/:eventId/guests/:guestId` | Remove |

A lista devolve junto um `stats` com `total`, `confirmed`, `pending`,
`declined`, `checkedIn` e `headcount` — esse último é o número real de pessoas,
somando acompanhantes.

### Presentes

| Método | Rota | O que faz |
| --- | --- | --- |
| GET/POST | `/api/events/:eventId/gifts` | Lista e cria |
| PATCH/DELETE | `/api/events/:eventId/gifts/:giftId` | Edita e apaga |
| POST | `/api/events/:eventId/gifts/:giftId/received` | Marca/desmarca como recebido |
| DELETE | `/api/events/:eventId/gifts/:giftId/reservation` | Libera uma reserva feita por engano |

Cada presente pode ter várias opções de loja com preços diferentes. Mandar
`options` no PATCH substitui a lista inteira.

### Marketplace

| Método | Rota | Precisa login? |
| --- | --- | --- |
| GET | `/api/vendors?category=&city=&q=&page=` | não |
| GET | `/api/vendors/categories` | não |
| GET | `/api/vendors/:idOrSlug` | não |
| POST | `/api/vendors` | sim — cria meu perfil de fornecedor |
| GET/PATCH | `/api/vendors/me` | sim |
| POST | `/api/vendors/me/photos` | sim — até 20 fotos |
| DELETE | `/api/vendors/me/photos/:photoId` | sim |
| GET | `/api/vendors/me/quotes` | sim — orçamentos que me pediram |
| PATCH | `/api/vendors/me/quotes/:quoteId` | sim — responder |
| POST | `/api/vendors/:idOrSlug/quotes` | não — pedir orçamento |
| POST | `/api/vendors/:idOrSlug/reviews` | sim — avaliar de 1 a 5 |

### Rotas públicas (o que o convidado acessa)

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/public/events/:publicCode` | Página do evento, se estiver publicado |
| GET | `/api/public/invite/:inviteToken` | Convite individual, já com o nome da pessoa |
| POST | `/api/public/invite/:inviteToken/rsvp` | Confirmar ou recusar |
| POST | `/api/public/gifts/:giftId/reserve` | Reservar um presente |

Cada convidado tem um `inviteToken` próprio. O link do convite fica
`/convite/<inviteToken>` no front, e o token é o que identifica a pessoa — não
precisa de senha.

Nada dessas rotas devolve a lista de convidados. O convidado vê o próprio nome
e, se o organizador deixou ligado, quantas pessoas confirmaram no total.

## Erros

Todo erro volta como `{ "error": "mensagem" }`. Erros de validação trazem
também `details`, com o campo e o motivo:

```json
{
  "error": "Dados invalidos",
  "details": [{ "campo": "email", "erro": "E-mail invalido" }]
}
```

Códigos usados: 400 validação, 401 sem login ou token vencido, 403 sem
permissão, 404 não existe, 409 conflito (e-mail repetido, presente já
reservado).

## O que ainda falta

- Upload de imagem de verdade. Hoje `coverImage`, `heroImage` e as fotos do
  portfólio guardam uma URL; falta um serviço de armazenamento.
- Envio de e-mail e WhatsApp com o link do convite.
- Recuperação de senha.
