# ClanHub

War Manager privado para um único clã de Clash of Clans. A dashboard lê a guerra atual no servidor, em `services/clash-of-clans`. As outras telas ainda usam dados de demonstração. Nada é gravado no banco.

## Stack

- Next.js 16 (App Router, TypeScript strict)
- Tailwind CSS 4
- shadcn/ui
- PostgreSQL
- Prisma ORM 7
- API oficial do Clash of Clans (`https://api.clashofclans.com/v1`)

## Estrutura

```text
app/            rotas, layout e route handlers
components/     componentes de interface, incluindo ui/ do shadcn
features/       regras de cada área do produto
lib/            ambiente, Prisma e utilitários compartilhados
services/       integração com a API oficial; a chave fica só no servidor
types/          tipagens das respostas oficiais usadas pelo serviço
prisma/         schema e migrations do PostgreSQL
```

## Endpoints oficiais usados

Confirmados em [developer.clashofclans.com](https://developer.clashofclans.com/) e na documentação estruturada da API. A base é `https://api.clashofclans.com/v1`. Cada pedido envia `Authorization: Bearer` e `Accept: application/json`. A tag entra na URL com o `#` codificado (`#2CLG8LJ2J` vira `%232CLG8LJ2J`).

| Consulta             | Método e caminho                              |
| -------------------- | --------------------------------------------- |
| Informações do clã   | `GET /clans/{clanTag}`                        |
| Membros              | `GET /clans/{clanTag}/members`                |
| Guerra atual         | `GET /clans/{clanTag}/currentwar`             |
| Grupo da liga        | `GET /clans/{clanTag}/currentwar/leaguegroup` |
| Guerra da liga       | `GET /clanwarleagues/wars/{warTag}`           |
| Histórico de guerras | `GET /clans/{clanTag}/warlog`                 |

Membros e histórico aceitam `limit`, `after` e `before`. `after` e `before` não podem ir juntos.

Nenhum outro endpoint é chamado. Jogador, busca de clãs, ligas e capital ficam de fora nesta etapa. A normalização de tag de jogador já existe para a sincronização futura.

## Requisitos

- Node.js 22 ou superior
- npm
- PostgreSQL 17, local ou via Docker

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente, se ainda não existir:

```bash
cp .env.example .env
```

3. Coloque a chave em `CLASH_API_KEY`. A tag do clã já está em `CLAN_TAG`.

4. Suba o PostgreSQL, se for usar o banco. Com Docker:

```bash
docker compose up -d
```

A URL padrão do exemplo é:

```text
postgresql://postgres:postgres@localhost:5432/clanhub?schema=public
```

5. Gere o Prisma Client e aplique a migration quando o banco estiver no ar:

```bash
npm run db:generate
npm run db:migrate
```

6. Inicie a aplicação:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A rota [http://localhost:3000/api/health](http://localhost:3000/api/health) responde `{ "status": "ok" }` e não consulta o banco nem a Supercell.

## Variáveis de ambiente

| Variável        | Uso                                                                            |
| --------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`  | Conexão PostgreSQL, lida só no servidor                                        |
| `CLASH_API_KEY` | Chave Bearer criada no portal da Supercell. Nunca use o prefixo `NEXT_PUBLIC_` |
| `CLAN_TAG`      | Tag pública do único clã gerenciado. O `#` inicial é opcional                  |

## Como testar cada consulta

Com o servidor no ar, use a tag configurada em `CLAN_TAG`. As rotas não aceitam outra tag: a chave não pode ser usada como proxy.

```bash
curl http://localhost:3000/api/clash/clan
curl http://localhost:3000/api/clash/members
curl "http://localhost:3000/api/clash/members?limit=10"
curl http://localhost:3000/api/clash/current-war
curl http://localhost:3000/api/clash/warlog
curl "http://localhost:3000/api/clash/warlog?limit=5"
```

Sem `CLASH_API_KEY`, a resposta é `503` e a mensagem diz que a variável não está definida. A consulta para antes de sair da máquina.

A normalização da tag pode ser conferida sem chave:

```bash
node --experimental-strip-types -e "import { normalizeClanTag, normalizePlayerTag } from './services/clash-of-clans/tags.ts'; console.log(normalizeClanTag('2clg8lj2j')); console.log(normalizePlayerTag('#2CLG8LJ2J'));"
```

O resultado esperado das duas chamadas é `#2CLG8LJ2J`.

Quando a chave e o IP estiverem autorizados:

- `/api/clash/clan` devolve o objeto do clã (`tag`, `name`, `members`, `isWarLogPublic`, entre outros campos documentados).
- `/api/clash/members` devolve `{ items, paging }`.
- `/api/clash/current-war` devolve a guerra. Fora de guerra, o estado vem `notInWar` e a maior parte dos campos não aparece.
- `/api/clash/warlog` devolve `{ items, paging }` se o histórico for público. Se for privado, a API responde `403`.

As mesmas quatro leituras estão em Configurações. O dashboard continua com o clã de demonstração.

`collectClanSnapshot` em `services/clash-of-clans` reúne as quatro consultas para um agendador futuro. Um histórico privado não derruba as outras três. Nada disso é gravado no Prisma.

O cache em memória evita repetir a mesma consulta: clã por 5 minutos, membros por 2 minutos, guerra atual por 1 minuto e histórico por 10 minutos. Erro não entra no cache. O processo reiniciado esvazia o cache. A opção `refresh` existe para a sincronização futura furar o cache.

## Limitações da API

- A chave é criada em **My Account** no portal. O IP de saída precisa estar autorizado. Sem isso a resposta é `403`.
- A tabela oficial de erros é `400`, `403`, `404`, `429`, `500` e `503`. Token inválido entra em `403`, não em `401`. O serviço ainda trata `401` se a API o devolver.
- `429` é limite do token. Quando a resposta traz `Retry-After`, ele segue no JSON.
- `503` é manutenção da Supercell.
- O histórico de guerra só existe quando `isWarLogPublic` é verdadeiro. Caso contrário, `GET /warlog` responde `403`.
- Fora de guerra, `GET /currentwar` responde `200` com `state: "notInWar"` e omite quase todos os outros campos. Durante a liga de guerra esse é o comportamento normal: o placar fica no grupo e na guerra da rodada.
- A guerra da liga não envia `attacksPerMember`. A dashboard lista quem não tem ataque registrado, sem inventar um limite.
- Os estados documentados, em camelCase, são `clanNotFound`, `accessDenied`, `notInWar`, `inMatchmaking`, `enterWar`, `matched`, `preparation`, `war`, `inWar` e `ended`. Respostas ao vivo também usam `warEnded`.
- Horários não são ISO-8601. O formato da API é `yyyyMMddTHHmmss.SSSZ`.
- A introdução da paginação mostra `paging.after` e `paging.before`. Respostas ao vivo também colocam os mesmos marcadores em `paging.cursors`.
- O schema publicado deixa `JsonLocalizedName`, `badgeUrls` e `iconUrls` sem campos internos. Nas respostas, `name` chega como texto e os ícones como `small`, `medium` e `large`.
- Os dados não são persistidos. A tabela `Clan` do Prisma continua só com a migration inicial.

## Scripts

```bash
npm run dev            # servidor de desenvolvimento
npm run build          # build de produção
npm run start          # serve o build
npm run lint           # ESLint
npm run format         # Prettier
npm run typecheck      # TypeScript sem emitir arquivos
npm run db:generate    # gera o Prisma Client
npm run db:migrate     # cria/aplica migrations em desenvolvimento
npm run db:deploy      # aplica migrations já existentes
npm run db:studio      # Prisma Studio
```

## Pendências manuais

- Criar a chave em [developer.clashofclans.com](https://developer.clashofclans.com/), autorizar o IP de saída e preencher `CLASH_API_KEY` no `.env` local. Não commite esse arquivo.
- Ter um PostgreSQL acessível pela `DATABASE_URL` antes de `npm run db:migrate`.
- A sincronização periódica ainda não grava guerra, membros nem histórico.
