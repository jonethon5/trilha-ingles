// Os sons do inglês: vogais e consoantes, cada um com o símbolo do alfabeto fonético (IPA),
// uma palavra de exemplo, mais dois exemplos e uma dica para quem fala português.
// Cada som: [símbolo, palavra, IPA da palavra, dica, outros exemplos].

export const SOUND_GROUPS = [
  {
    id: "vowels",
    title: "Vogais",
    note: "O inglês tem bem mais vogais que o português. Repare nos pares curto e longo.",
    sounds: [
      ["i", "see", "si", "i longo, como em \"vi\", segurando um pouco", "eat me"],
      ["ɪ", "sit", "sɪt", "i curto e relaxado, entre o \"i\" e o \"ê\"", "big this"],
      ["ɛ", "bed", "bɛd", "é aberto, como em \"pé\"", "red ten"],
      ["æ", "cat", "kæt", "entre \"é\" e \"a\": abra bem a boca", "bad man"],
      ["ɑ", "hot", "hɑt", "a bem aberto, lá no fundo da boca", "stop father"],
      ["ɔ", "saw", "sɔ", "ó aberto, como em \"pó\"", "dog call"],
      ["ʊ", "book", "bʊk", "u curto e relaxado", "good put"],
      ["u", "blue", "blu", "u longo, como em \"tu\"", "food you"],
      ["ʌ", "cup", "kʌp", "a curto e fechado, parecido com o \"a\" de \"cama\"", "but love"],
      ["ə", "about", "əˈbaʊt", "vogal fraca e rápida, quase engolida; é o som mais comum do inglês", "sofa today"],
      ["ɜr", "bird", "bɜrd", "um \"âr\" só, sem mexer a boca do começo ao fim", "work girl"],
      ["ər", "water", "ˈwɔtər", "o mesmo som, só que fraco, no fim das palavras", "teacher after"],
      ["ɑr", "car", "kɑr", "a aberto seguido do R enrolado", "star park"],
      ["ɔr", "more", "mɔr", "ó aberto seguido do R enrolado", "door four"],
      ["eɪ", "day", "deɪ", "\"êi\", como em \"lei\"", "make rain"],
      ["aɪ", "my", "maɪ", "\"ai\", como em \"pai\"", "time night"],
      ["ɔɪ", "boy", "bɔɪ", "\"ói\", como em \"dói\"", "toy coin"],
      ["aʊ", "now", "naʊ", "\"au\", como em \"mau\"", "house down"],
      ["oʊ", "go", "ɡoʊ", "\"ôu\", como em \"vou\"", "home know"],
    ],
  },
  {
    id: "consonants",
    title: "Consoantes",
    note: "Muitas soam como em português. As do fim da lista são as que não existem na nossa língua.",
    sounds: [
      ["p", "pen", "pɛn", "como o nosso \"p\", mas com um sopro de ar no começo da palavra", "stop happy"],
      ["b", "baby", "ˈbeɪbi", "igual ao \"b\" do português", "big job"],
      ["t", "tea", "ti", "língua atrás dos dentes, com sopro. Nunca vira \"tch\" antes de \"i\"", "ten water"],
      ["d", "dog", "dɔɡ", "igual ao \"d\" de \"dado\". Nunca vira \"dj\" antes de \"i\"", "day bed"],
      ["k", "key", "ki", "como o \"c\" de \"casa\", com sopro no começo da palavra", "cat book"],
      ["ɡ", "get", "ɡɛt", "sempre como o \"g\" de \"gato\"", "go big"],
      ["f", "five", "faɪv", "igual ao \"f\" do português", "food off"],
      ["v", "very", "ˈvɛri", "igual ao \"v\" do português", "love seven"],
      ["s", "sun", "sʌn", "como o \"s\" de \"sol\", mesmo entre vogais", "see bus"],
      ["z", "zoo", "zu", "como o \"z\" de \"zebra\"", "is easy"],
      ["m", "moon", "mun", "feche os lábios até o fim: no fim da palavra não some como em \"bom\"", "man time"],
      ["n", "no", "noʊ", "encoste a língua no céu da boca até o fim, mesmo no fim da palavra", "name ten"],
      ["l", "like", "laɪk", "no fim da palavra a língua encosta atrás dos dentes; não vira \"u\"", "love call"],
      ["h", "hat", "hæt", "um sopro leve, como o \"r\" de \"rato\" bem suave", "house hello"],
      ["r", "red", "rɛd", "língua enrolada para trás, sem encostar em nada; nunca como o \"r\" de \"rato\"", "right car"],
      ["θ", "think", "θɪŋk", "língua entre os dentes e sopre, sem voz. Não é \"f\" nem \"t\"", "three both"],
      ["ð", "this", "ðɪs", "língua entre os dentes, com voz. Não é \"d\" nem \"z\"", "mother the"],
      ["ŋ", "sing", "sɪŋ", "o \"n\" de \"banco\", sem pronunciar o \"g\" no fim", "long thing"],
      ["ʃ", "she", "ʃi", "\"ch\" de \"chá\"", "shoe fish"],
      ["ʒ", "measure", "ˈmɛʒər", "\"j\" de \"já\"", "usually television"],
      ["tʃ", "chair", "tʃɛr", "\"tch\", como o \"t\" de \"tia\" no sotaque carioca", "watch much"],
      ["dʒ", "job", "dʒɑb", "\"dj\", como o \"d\" de \"dia\" no sotaque carioca", "just orange"],
      ["j", "yes", "jɛs", "\"i\" rápido, como em \"iate\"", "you year"],
      ["w", "we", "wi", "\"u\" rápido, como em \"uau\"", "water one"],
    ],
  },
];

// Os dois sinais de acento que aparecem nas transcrições.
export const STRESS_MARKS = [
  ["ˈ", "today", "təˈdeɪ", "a sílaba depois do sinal é a mais forte: to-DAY"],
  ["ˌ", "understand", "ˌʌndərˈstænd", "acento secundário: um pouco forte, menos que a principal"],
];

// Pares de palavras que diferem em um único som, para treinar o ouvido.
// Cada par: [palavra, palavra, o que muda].
export const MINIMAL_PAIRS = [
  ["ship", "sheep", "ɪ curto × i longo"],
  ["sit", "seat", "ɪ curto × i longo"],
  ["full", "fool", "ʊ curto × u longo"],
  ["bed", "bad", "ɛ × æ"],
  ["men", "man", "ɛ × æ"],
  ["cup", "cap", "ʌ × æ"],
  ["think", "sink", "θ × s"],
  ["three", "tree", "θ × t"],
  ["they", "day", "ð × d"],
  ["hat", "rat", "h × r"],
  ["wash", "watch", "ʃ × tʃ"],
  ["work", "walk", "ɜr × ɔ"],
];

export const extras = (sound) => sound[4].split(" ");

// Todas as palavras que precisam de áudio próprio.
export function guideWords() {
  const words = [];
  for (const group of SOUND_GROUPS) for (const sound of group.sounds) words.push(sound[1], ...extras(sound));
  for (const [, word] of STRESS_MARKS) words.push(word);
  for (const [a, b] of MINIMAL_PAIRS) words.push(a, b);
  return [...new Set(words)];
}
