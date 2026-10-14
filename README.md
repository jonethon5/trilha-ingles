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

## As seis abas

| Aba | O que tem |
|---|---|
| **Aprender** | A trilha: 8 unidades, 24 lições e 192 frases. Cada unidade tem guia de vocabulário, um baú de gemas e uma revisão final que libera a unidade seguinte. |
| **Sons** | As vogais e consoantes do inglês em uma grade, com o símbolo fonético e a palavra de exemplo. Tocar em um som toca a palavra e abre a ficha dele. Um treino de ouvido usa pares parecidos, como "ship" e "sheep". |
| **Histórias** | Contos infantis recontados em inglês simples, em cinco partes curtas, uma parte nova por dia. A leitura avança frase a frase com a tradução embaixo (que dá para esconder); tocar em uma palavra mostra o significado e toca o áudio; o botão ＋ manda a frase ou a palavra para os flashcards, com o inglês na frente. |
| **Revisão** | Flashcards no estilo do Anki: frente em português, verso em inglês com áudio, e quatro botões (Errei, Difícil, Bom, Fácil) que decidem quando o cartão volta. O conteúdo é um baralho de 50 verbos, cada um em cinco frases diferentes. Os cartões próprios liberam com 20 palavras aprendidas, ou de cara para quem declara nível intermediário. |
| **Falar** | Treino de pronúncia em quatro níveis (A1 a B2): você ouve a frase, vê a transcrição fonética (IPA), toca em qualquer palavra para ouvi-la sozinha, grava a sua voz e compara com o modelo. Um guia de sons explica cada símbolo, com exemplo e dica para quem fala português. |
| **Perfil** | Nível, estatísticas, conquistas, ajustes e backup. |

As **missões do dia** (três por dia, que pagam gemas) e a sequência de dias abrem pelo 🎯 e pelo 🔥 da barra do topo.

## Personagens e movimento

Cinco personagens de corpo inteiro e a coruja são desenhados em SVG por código (`js/characters.js`, `js/owl.js`). Eles piscam, respiram, mexem a boca enquanto um áudio toca (a classe `talking` no `<body>`, ligada pelos eventos do elemento de áudio), comemoram no acerto e murcham no erro. As animações de tela, o confete e a contagem dos números usam a Web Animations API (`js/fx.js`). Os efeitos sonoros são ondas geradas em memória, sem arquivos.

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

## Áudio e vozes

Tudo o que é falado no app tem áudio gravado em `audio/` (1.268 arquivos, 5,7 MB), gerado no computador com o sintetizador [Piper](https://github.com/rhasspy/piper). Cada personagem tem a sua voz, definida em `js/voices.js`, e a tela mostra sempre o personagem dono da voz que está tocando:

| Personagem | Voz | Licença |
|---|---|---|
| Cora (palavras soltas e sons) | `en_US-ljspeech-medium` | domínio público |
| Bia | `en_US-libritts_r-medium`, voz 315 | CC BY 4.0 |
| Malu | `en_US-libritts_r-medium`, voz 60 | CC BY 4.0 |
| Dona Rosa | `en_US-kristin-medium` | domínio público |
| Leo | `en_US-bryce-medium` | domínio público |
| Tom | `en_US-norman-medium` | domínio público |

As vozes foram escolhidas medindo o tom de cada uma (frequência fundamental), e a velocidade foi igualada para todas falarem no mesmo ritmo. Vozes com licença não comercial (como Ryan e HFC) ficaram de fora.

Junto com cada áudio, a ferramenta grava um **mapa da boca**: o volume da fala 25 vezes por segundo. Enquanto o áudio toca, `js/audio.js` lê esse mapa e atualiza a variável CSS `--mouth`, e a boca do personagem abre e fecha no ritmo da fala.

Para gerar de novo depois de mudar o conteúdo ou as vozes:

```bash
PIPER=caminho/piper.exe VOICES=pasta/dos/modelos LAME=caminho/lame.exe node tools/make-audio.mjs
```

Ao trocar vozes, aumente também `AUDIO_CACHE` em `sw.js`, porque os caminhos dos arquivos continuam os mesmos.

O texto falado soma cerca de 18 mil caracteres. Por isso, trocar por uma voz paga (OpenAI, ElevenLabs, Azure) é um custo único e pequeno: o áudio é gerado uma vez e servido a todos os usuários.

As frases cadastradas pelo usuário não têm gravação; o botão de ouvir usa a voz do aparelho quando ela está disponível.

Crédito: LibriTTS-R, Y. Koizumi et al., 2023, licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
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
| `js/stories.js`, `js/ipa.js` | Histórias com glossário, e os sons do inglês |
| `js/characters.js`, `js/owl.js`, `js/fx.js` | Personagens, mascote e efeitos visuais |
| `js/voices.js` | Voz de cada personagem e quem fala cada frase |
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
