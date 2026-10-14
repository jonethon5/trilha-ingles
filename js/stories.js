// Histórias: contos infantis conhecidos, recontados em inglês simples e divididos em partes curtas.
// Cada frase é [inglês, português]. As histórias vão ficando um pouco mais difíceis.

const DATA = [
  {
    id: "goldilocks",
    title: "Goldilocks and the Three Bears",
    pt: "Cachinhos Dourados e os Três Ursos",
    icon: "🐻",
    level: "A1",
    parts: [
      ["A casa na floresta", [
        ["Once upon a time, there were three bears.", "Era uma vez três ursos."],
        ["They lived in a small house in the forest.", "Eles moravam em uma casa pequena na floresta."],
        ["One morning, they made porridge for breakfast.", "Certa manhã, eles fizeram mingau para o café da manhã."],
        ["The porridge was too hot.", "O mingau estava quente demais."],
        ["So they went for a walk.", "Então eles foram dar uma caminhada."],
        ["They left the door open.", "Eles deixaram a porta aberta."],
      ]],
      ["A menina curiosa", [
        ["A little girl was walking in the forest.", "Uma menininha estava andando na floresta."],
        ["Her name was Goldilocks.", "O nome dela era Cachinhos Dourados."],
        ["She saw the house and looked inside.", "Ela viu a casa e olhou para dentro."],
        ["Nobody was home.", "Não havia ninguém em casa."],
        ["She was hungry, so she went in.", "Ela estava com fome, então entrou."],
        ["She saw three bowls on the table.", "Ela viu três tigelas na mesa."],
      ]],
      ["O mingau e a cadeira", [
        ["The first bowl was too hot.", "A primeira tigela estava quente demais."],
        ["The second bowl was too cold.", "A segunda tigela estava fria demais."],
        ["The third bowl was just right.", "A terceira tigela estava no ponto certo."],
        ["She ate all the porridge.", "Ela comeu todo o mingau."],
        ["Then she sat on a small chair.", "Depois ela se sentou em uma cadeira pequena."],
        ["The chair broke!", "A cadeira quebrou!"],
      ]],
      ["Hora de dormir", [
        ["Goldilocks felt very tired.", "Cachinhos Dourados se sentiu muito cansada."],
        ["She went to the bedroom.", "Ela foi para o quarto."],
        ["The first bed was too hard.", "A primeira cama era dura demais."],
        ["The second bed was too soft.", "A segunda cama era macia demais."],
        ["The third bed was just right.", "A terceira cama era perfeita."],
        ["She fell asleep.", "Ela pegou no sono."],
      ]],
      ["Os ursos voltam", [
        ["The three bears came home.", "Os três ursos voltaram para casa."],
        ["\"Someone ate my porridge!\" said the little bear.", "\"Alguém comeu o meu mingau!\", disse o ursinho."],
        ["They looked in the bedroom.", "Eles olharam no quarto."],
        ["\"Someone is sleeping in my bed!\"", "\"Alguém está dormindo na minha cama!\""],
        ["Goldilocks woke up and saw the bears.", "Cachinhos Dourados acordou e viu os ursos."],
        ["She ran away and never came back.", "Ela fugiu e nunca mais voltou."],
      ]],
    ],
  },
  {
    id: "tortoise",
    title: "The Tortoise and the Hare",
    pt: "A Tartaruga e a Lebre",
    icon: "🐢",
    level: "A1",
    parts: [
      ["A lebre convencida", [
        ["A hare lived near a big field.", "Uma lebre morava perto de um campo grande."],
        ["He was very fast.", "Ele era muito rápido."],
        ["He liked to laugh at the other animals.", "Ele gostava de rir dos outros animais."],
        ["\"You are all so slow,\" he said.", "\"Vocês são todos tão lentos\", ele disse."],
        ["One day, he saw a tortoise.", "Um dia, ele viu uma tartaruga."],
        ["\"You are the slowest animal I know!\"", "\"Você é o animal mais lento que eu conheço!\""],
      ]],
      ["O desafio", [
        ["The tortoise was not angry.", "A tartaruga não ficou brava."],
        ["\"Let's have a race,\" she said.", "\"Vamos fazer uma corrida\", ela disse."],
        ["The hare laughed for a long time.", "A lebre riu por um bom tempo."],
        ["\"A race? With you? That is easy!\"", "\"Uma corrida? Com você? Isso é fácil!\""],
        ["All the animals came to watch.", "Todos os animais vieram assistir."],
        ["The fox said, \"Ready, go!\"", "A raposa disse: \"Preparar, já!\""],
      ]],
      ["A corrida começa", [
        ["The hare ran very fast.", "A lebre correu muito rápido."],
        ["Soon he could not see the tortoise.", "Logo ele não conseguia ver a tartaruga."],
        ["\"I have a lot of time,\" he thought.", "\"Eu tenho muito tempo\", ele pensou."],
        ["He stopped under a tree.", "Ele parou embaixo de uma árvore."],
        ["The sun was warm and he felt sleepy.", "O sol estava quente e ele ficou com sono."],
        ["He closed his eyes and fell asleep.", "Ele fechou os olhos e pegou no sono."],
      ]],
      ["Devagar e sempre", [
        ["The tortoise walked slowly.", "A tartaruga andava devagar."],
        ["She did not stop to rest.", "Ela não parou para descansar."],
        ["She kept going, step by step.", "Ela continuou, passo a passo."],
        ["She passed the tree and saw the hare.", "Ela passou pela árvore e viu a lebre."],
        ["He was still sleeping.", "Ele ainda estava dormindo."],
        ["She smiled and kept walking.", "Ela sorriu e continuou andando."],
      ]],
      ["A chegada", [
        ["The hare woke up late in the afternoon.", "A lebre acordou no fim da tarde."],
        ["He ran as fast as he could.", "Ele correu o mais rápido que pôde."],
        ["But the tortoise was already at the finish line.", "Mas a tartaruga já estava na linha de chegada."],
        ["All the animals were cheering for her.", "Todos os animais estavam torcendo por ela."],
        ["The hare learned an important lesson.", "A lebre aprendeu uma lição importante."],
        ["Slow and steady wins the race.", "Devagar e sempre se vence a corrida."],
      ]],
    ],
  },
  {
    id: "pigs",
    title: "The Three Little Pigs",
    pt: "Os Três Porquinhos",
    icon: "🐷",
    level: "A2",
    parts: [
      ["Três irmãos", [
        ["Three little pigs left home to build their own houses.", "Três porquinhos saíram de casa para construir as suas próprias casas."],
        ["The first pig did not like to work.", "O primeiro porquinho não gostava de trabalhar."],
        ["He built his house with straw in one day.", "Ele construiu a casa dele com palha em um dia."],
        ["The second pig built his house with sticks.", "O segundo porquinho construiu a casa dele com gravetos."],
        ["It took him two days.", "Ele levou dois dias."],
        ["Then they played in the sun all week.", "Depois eles brincaram no sol a semana toda."],
      ]],
      ["A casa de tijolos", [
        ["The third pig wanted a strong house.", "O terceiro porquinho queria uma casa forte."],
        ["He decided to use bricks.", "Ele decidiu usar tijolos."],
        ["He worked hard every day.", "Ele trabalhou duro todos os dias."],
        ["His brothers laughed at him.", "Os irmãos dele riram dele."],
        ["\"Why do you work so much?\" they asked.", "\"Por que você trabalha tanto?\", eles perguntaram."],
        ["\"Because a good house keeps you safe,\" he said.", "\"Porque uma boa casa mantém você seguro\", ele disse."],
      ]],
      ["O lobo chega", [
        ["One day, a big bad wolf came to the forest.", "Um dia, um lobo mau veio para a floresta."],
        ["He was very hungry.", "Ele estava com muita fome."],
        ["He knocked on the door of the straw house.", "Ele bateu na porta da casa de palha."],
        ["\"Little pig, let me come in!\"", "\"Porquinho, me deixe entrar!\""],
        ["\"No! Go away!\" said the first pig.", "\"Não! Vá embora!\", disse o primeiro porquinho."],
        ["The wolf blew the house down.", "O lobo derrubou a casa com um sopro."],
      ]],
      ["Correndo do lobo", [
        ["The first pig ran to his brother's house.", "O primeiro porquinho correu para a casa do irmão."],
        ["The wolf followed him.", "O lobo o seguiu."],
        ["He blew the stick house down too.", "Ele derrubou a casa de gravetos também."],
        ["The two pigs ran as fast as they could.", "Os dois porquinhos correram o mais rápido que puderam."],
        ["They got to the brick house just in time.", "Eles chegaram à casa de tijolos bem a tempo."],
        ["Their brother opened the door and let them in.", "O irmão deles abriu a porta e os deixou entrar."],
      ]],
      ["A casa forte", [
        ["The wolf blew and blew.", "O lobo soprou e soprou."],
        ["But the brick house did not move.", "Mas a casa de tijolos não se mexeu."],
        ["He tried to come in through the chimney.", "Ele tentou entrar pela chaminé."],
        ["The pigs had a pot of hot water there.", "Os porquinhos tinham uma panela de água quente ali."],
        ["The wolf ran away and never came back.", "O lobo fugiu e nunca mais voltou."],
        ["The three pigs lived happily in the brick house.", "Os três porquinhos viveram felizes na casa de tijolos."],
      ]],
    ],
  },
];

// Significado de cada palavra das histórias, para o toque na palavra. A chave é a palavra em minúsculas.
export const GLOSSARY = {
  a: "um, uma", afternoon: "tarde", all: "todo, todos", already: "já", an: "um, uma", and: "e", angry: "bravo", animal: "animal", animals: "animais",
  are: "são, estão", as: "tão, como", asked: "perguntou, perguntaram", asleep: "adormecido", at: "em, para", ate: "comeu", away: "embora, para longe",
  back: "de volta", bad: "mau", bear: "urso", bears: "ursos", because: "porque", bed: "cama", bedroom: "quarto", big: "grande", blew: "soprou",
  bowl: "tigela", bowls: "tigelas", breakfast: "café da manhã", brick: "tijolo", bricks: "tijolos", broke: "quebrou", brother: "irmão",
  "brother's": "do irmão", brothers: "irmãos", build: "construir", built: "construiu", but: "mas", by: "por, a", came: "veio, vieram",
  chair: "cadeira", cheering: "torcendo, comemorando", chimney: "chaminé", closed: "fechou", cold: "frio", come: "vir, entrar", could: "podia, conseguia",
  day: "dia", days: "dias", decided: "decidiu", did: "(auxiliar do passado)", do: "(auxiliar de pergunta) fazer", door: "porta", down: "para baixo, abaixo",
  easy: "fácil", every: "todo, cada", eyes: "olhos", fast: "rápido", fell: "caiu", felt: "sentiu", field: "campo", finish: "chegada, terminar",
  first: "primeiro", followed: "seguiu", for: "para, por", forest: "floresta", fox: "raposa", girl: "menina", go: "ir, vá", going: "indo",
  goldilocks: "Cachinhos Dourados", good: "bom, boa", got: "chegou, conseguiu", had: "tinha, tinham", happily: "felizes, alegremente",
  hard: "duro, muito", hare: "lebre", have: "ter", he: "ele", her: "dela, ela", him: "ele, o", his: "dele", home: "casa, lar", hot: "quente",
  house: "casa", houses: "casas", hungry: "com fome", i: "eu", important: "importante", in: "em, dentro", inside: "dentro", is: "é, está", it: "isso, ele",
  just: "bem, exatamente", keeps: "mantém", kept: "continuou", knocked: "bateu", know: "conhecer, saber", late: "tarde", laugh: "rir",
  laughed: "riu, riram", learned: "aprendeu", left: "deixou, saiu", lesson: "lição", let: "deixar", "let's": "vamos", like: "gostar",
  liked: "gostava", line: "linha", little: "pequeno", lived: "morava, viveram", long: "longo", looked: "olhou, olharam", lot: "muito (a lot of)",
  made: "fez, fizeram", me: "me, mim", morning: "manhã", move: "mexer, mover", much: "muito", my: "meu, minha", name: "nome", near: "perto de",
  never: "nunca", no: "não", nobody: "ninguém", not: "não", of: "de", on: "em, sobre", once: "uma vez", one: "um, uma", open: "aberto",
  opened: "abriu", other: "outro, outros", own: "próprio", passed: "passou", pig: "porco, porquinho", pigs: "porcos, porquinhos",
  played: "brincaram, jogaram", porridge: "mingau", pot: "panela", race: "corrida", ran: "correu, correram", ready: "pronto", rest: "descansar",
  right: "certo", safe: "seguro", said: "disse", sat: "sentou", saw: "viu", second: "segundo", see: "ver", she: "ela", sleeping: "dormindo",
  sleepy: "com sono", slow: "lento, devagar", slowest: "o mais lento", slowly: "devagar", small: "pequeno", smiled: "sorriu", so: "então, tão",
  soft: "macio", someone: "alguém", soon: "logo", steady: "constante, firme", step: "passo", stick: "graveto", sticks: "gravetos", still: "ainda",
  stop: "parar", stopped: "parou", straw: "palha", strong: "forte", sun: "sol", table: "mesa", that: "isso, aquilo", the: "o, a, os, as",
  their: "deles, delas", them: "eles, os", then: "depois, então", there: "lá, ali; there were = havia", they: "eles, elas", third: "terceiro",
  thought: "pensou", three: "três", through: "através de, por", time: "tempo, vez", tired: "cansado", to: "para, a", too: "demais; também",
  took: "levou", tortoise: "tartaruga", tree: "árvore", tried: "tentou", two: "dois, duas", under: "embaixo de", up: "para cima; woke up = acordou",
  upon: "sobre; once upon a time = era uma vez", use: "usar", very: "muito", walk: "caminhada, andar", walked: "andou, andava", walking: "andando",
  wanted: "queria", warm: "quente, morno", was: "era, estava", watch: "assistir", water: "água", week: "semana", went: "foi, foram",
  were: "eram, estavam", why: "por que", wins: "vence", with: "com", woke: "acordou", wolf: "lobo", work: "trabalhar", worked: "trabalhou",
  you: "você, vocês",
};

export const STORIES = DATA.map((story) => ({
  ...story,
  parts: story.parts.map(([title, sentences], partIndex) => ({
    title,
    index: partIndex,
    sentences: sentences.map(([en, pt], i) => ({ id: `${story.id}-${partIndex + 1}-${i + 1}`, en, pt })),
  })),
}));

export const storyById = new Map(STORIES.map((s) => [s.id, s]));

// Divide a frase em pedaços para a tela: palavras (tocáveis) e o que fica entre elas (espaços, pontuação).
export function pieces(sentence) {
  const out = [];
  for (const match of sentence.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?|[^A-Za-z]+/g)) {
    const text = match[0];
    const word = /^[A-Za-z]/.test(text);
    out.push(word ? { text, word: text.toLowerCase().replace("’", "'") } : { text, word: null });
  }
  return out;
}
