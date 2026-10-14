# Trilha

App para estudar inglês em lições curtas, com repetição espaçada. Roda no navegador, instala no iPhone como PWA e funciona offline.

A ideia junta dois modelos: as lições em sequência e os exercícios variados dos apps de idiomas, e a repetição espaçada dos apps de flashcards, que decide quando cada frase volta para revisão.

## Instalar no iPhone

1. Abra o endereço do app no **Safari**.
2. Toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.
3. Abra pelo ícone novo. A partir daí funciona sem internet.

## Como funciona

**Trilha.** Um curso embutido com 8 unidades, 24 lições e 192 frases do dia a dia. Cada lição libera a seguinte.

**Quatro tipos de exercício:**

| Exercício | O que você faz |
|---|---|
| Múltipla escolha | Lê a frase em inglês e escolhe a tradução |
| Montar a frase | Lê em português e monta a frase em inglês com um banco de palavras |
| Ouvir e montar | Ouve a frase e monta o que ouviu |
| Traduzir digitando | Lê em português e escreve em inglês |

Uma lição nova começa pelos exercícios fáceis. Nas revisões, quanto mais firme a frase está na memória, mais difícil é o exercício sorteado.

**Repetição espaçada.** Cada frase tem a sua própria data de revisão. Acertar multiplica o intervalo (1 dia, 3, 8, 20...); errar volta para 1 dia e marca a frase como mais difícil. É o algoritmo SM-2, o mesmo do Anki, reduzido a acertou ou errou.

**Jogo.** XP e níveis, sequência de dias, meta diária e 5 vidas por sessão.

**Baralhos do Anki.** Na aba Baralhos dá para importar um pacote `.apkg` de frases em português e inglês. O app usa as frases e o áudio gravado para montar os mesmos exercícios, e pode manter o progresso que você já tinha no Anki.

## Áudio

O curso embutido usa a voz do próprio aparelho (Web Speech API). Os baralhos importados usam o áudio gravado que vem no pacote.

## Dados

O progresso fica no `localStorage` do aparelho e os baralhos importados no IndexedDB. Não há servidor nem conta. Em **Perfil → Salvar backup** dá para exportar o progresso.

## Desenvolvimento

Sem etapa de build: são arquivos estáticos.

```bash
npx serve .          # ou qualquer servidor estático
node test/run.mjs    # testes
```

| Arquivo | Responsabilidade |
|---|---|
| `js/course.js` | Conteúdo do curso |
| `js/srs.js` | Repetição espaçada |
| `js/exercise.js` | Montagem e conferência dos quatro exercícios |
| `js/game.js` | XP, níveis, sequência e vidas |
| `js/store.js` | Progresso no localStorage |
| `js/decks.js` | Baralhos importados e áudio no IndexedDB |
| `js/importer.js`, `js/anki.js` | Leitura e conversão de pacotes do Anki |
| `js/speech.js` | Pronúncia com a voz do aparelho |
| `js/app.js` | Telas e eventos |
| `sw.js` | Cache para uso offline |

Ao alterar qualquer arquivo do app, aumente `VERSION` em `sw.js` para os aparelhos instalados baixarem a versão nova.

Bibliotecas em `vendor/`: [sql.js](https://github.com/sql-js/sql.js), [fflate](https://github.com/101arrowz/fflate) e [fzstd](https://github.com/101arrowz/fzstd), todas com licença MIT.

Projeto independente, sem vínculo com o Anki nem com o Duolingo.
