# Trilha

App para estudar inglês em lições curtas, com repetição espaçada e treino de fala. Roda no navegador, instala no iPhone como PWA e funciona offline.

A ideia junta dois modelos: a trilha de lições, as vidas e as missões dos apps de idiomas, e a repetição espaçada dos apps de flashcards, que decide quando cada frase volta para revisão.

## Instalar no iPhone

1. Abra o endereço do app no **Safari**.
2. Toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.
3. Abra pelo ícone novo. Em **Perfil → Baixar áudios** dá para guardar todos os áudios e usar sem internet.

## Primeira abertura

A coruja Cora, mascote do app, faz três perguntas: por que a pessoa quer aprender inglês, quanto já sabe e quanto tempo tem por dia. As respostas viram um plano (`planFor` em `js/game.js`): a meta diária de XP, quantas palavras novas entram por dia, quantas frases de fala e em que unidade a trilha começa. Depois ela apresenta cada aba na primeira vez que é aberta.

A tela inicial tem o botão "Já tenho uma conta", mas contas ainda não existem: o progresso fica só no aparelho.

## As cinco abas

| Aba | O que tem |
|---|---|
| **Aprender** | A trilha: 8 unidades, 24 lições e 192 frases. Cada unidade tem guia de vocabulário, um baú de gemas e uma revisão final que libera a unidade seguinte. |
| **Revisão** | Flashcards no estilo do Anki: frente em português, verso em inglês com áudio, e quatro botões (Errei, Difícil, Bom, Fácil) que decidem quando o cartão volta. O conteúdo é um baralho de 50 verbos, cada um em cinco frases diferentes. Os cartões próprios liberam com 20 palavras aprendidas, ou de cara para quem declara nível intermediário. |
| **Falar** | Treino de pronúncia em quatro níveis (A1 a B2): você ouve a frase, vê a transcrição fonética (IPA), toca em qualquer palavra para ouvi-la sozinha, grava a sua voz e compara com o modelo. Um guia de sons explica cada símbolo, com exemplo e dica para quem fala português. |
| **Missões** | Três missões por dia, que pagam gemas, mais a sequência de dias e a meta diária. |
| **Perfil** | Nível, estatísticas, conquistas, ajustes e backup. |

## Exercícios

| Exercício | O que você faz |
|---|---|
| Ligar pares | Liga cada palavra em inglês à tradução |
| Múltipla escolha | Lê a frase em inglês e escolhe a tradução |
| Montar a frase | Lê em português e monta a frase com um banco de palavras |
| Ouvir e montar | Ouve a frase e monta o que ouviu |
| Traduzir digitando | Lê em português e escreve em inglês |

Uma lição nova vai do mais fácil ao mais difícil. Nas revisões, quanto mais firme a frase está na memória, mais difícil é o exercício sorteado.

## Regras do jogo

- **Vidas**: 5. Errar em lição nova gasta uma; voltam uma a cada 4 horas, ou uma por sessão de revisão concluída. Revisar e praticar não gastam vidas.
- **XP e níveis**: cada sessão dá XP, com bônus se for sem erros.
- **Gemas**: vêm das missões, dos baús e de subir de nível. Na loja compram recarga de vidas e bloqueio de sequência.
- **Sequência**: conta os dias seguidos de estudo. O bloqueio cobre um dia perdido.

## Repetição espaçada

Cada frase tem a sua própria data de revisão. Acertar multiplica o intervalo (1 dia, 3, 8, 20...); errar volta para 1 dia e marca a frase como mais difícil. É o algoritmo SM-2, o mesmo do Anki, em `js/srs.js`. Nos flashcards valem os quatro botões; nos exercícios da trilha, acertar conta como "Bom" e errar como "Errei".

## Como a fala é comparada

A comparação é feita no próprio aparelho, sem enviar a gravação a lugar nenhum (`js/pronounce.js`):

1. As duas gravações (modelo e aluno) vão para 16 kHz e têm o silêncio das pontas cortado.
2. Cada uma é fatiada em janelas de 25 ms, e cada janela vira coeficientes MFCC e seus deltas, a representação clássica de reconhecimento de fala.
3. As duas sequências são alinhadas no tempo com DTW, porque ninguém fala na mesma velocidade.
4. A distância média ao longo do alinhamento vira uma nota de 0 a 100.

**Limite importante:** a nota mede semelhança com o modelo em ritmo e em sons. Não é um avaliador de pronúncia treinado. Ela foi calibrada com vozes sintéticas (a mesma frase dita por outra voz fica em torno de 88; frases diferentes, em torno de 25), e em frases muito curtas a separação é fraca. Serve para acompanhar a evolução na mesma frase, não como veredito.

## Áudio

Todas as frases, palavras e vocabulário do curso têm áudio gravado em `audio/` (1.029 arquivos, 4,6 MB), gerado com o sintetizador [Piper](https://github.com/rhasspy/piper) e a voz `en_US-ljspeech-medium`, treinada no LJ Speech Dataset, de domínio público. Para gerar de novo depois de mudar o conteúdo:

```bash
PIPER=caminho/piper.exe VOICE=caminho/en_US-ljspeech-medium.onnx LAME=caminho/lame.exe node tools/make-audio.mjs
```

As frases cadastradas pelo usuário não têm gravação; o botão de ouvir usa a voz do aparelho quando ela está disponível.

## Dados

O progresso fica no `localStorage` do aparelho. Não há servidor nem conta. Em **Perfil → Salvar backup** dá para exportar tudo em um arquivo.

## Desenvolvimento

Sem etapa de build e sem dependências: são arquivos estáticos.

```bash
npx serve .          # ou qualquer servidor estático
node test/run.mjs    # testes
```

| Arquivo | Responsabilidade |
|---|---|
| `js/course.js`, `js/speaking.js`, `js/words.js` | Conteúdo: curso, frases do treino de fala com IPA e baralho de palavras em contexto |
| `js/ipa.js`, `js/owl.js` | Guia de sons e o desenho da mascote |
| `js/srs.js` | Repetição espaçada |
| `js/exercise.js` | Montagem e conferência dos exercícios |
| `js/game.js` | XP, níveis, vidas, gemas, sequência, missões e conquistas |
| `js/pronounce.js` | Comparação de pronúncia (MFCC + DTW) |
| `js/recorder.js` | Gravação pelo microfone e decodificação de áudio |
| `js/audio.js`, `js/audio-paths.js` | Reprodução de áudio e efeitos sonoros |
| `js/store.js` | Progresso no localStorage |
| `js/core.js` | Estado e utilidades compartilhadas pelas telas |
| `js/ui/*.js` | Uma tela por arquivo |
| `sw.js` | Cache para uso offline |
| `tools/` | Geração dos áudios e calibração da nota de fala |

Ao alterar qualquer arquivo do app, aumente `VERSION` em `sw.js` para os aparelhos instalados baixarem a versão nova.

Projeto independente, sem vínculo com o Duolingo nem com o Anki.
