// Guia de sons: cada símbolo do alfabeto fonético (IPA) usado no app, com uma palavra de exemplo
// e uma dica de como soa para quem fala português. Cada item: [símbolo, palavra, IPA da palavra, dica].

export const IPA_GUIDE = [
  {
    title: "Vogais",
    note: "O inglês tem mais vogais que o português. As que mais confundem são os pares curto/longo.",
    sounds: [
      ["i", "see", "si", "i longo, como em \"vi\", segurando um pouco"],
      ["ɪ", "sit", "sɪt", "i curto e relaxado, entre o \"i\" e o \"ê\""],
      ["ɛ", "bed", "bɛd", "é aberto, como em \"pé\""],
      ["æ", "cat", "kæt", "entre \"é\" e \"a\": abra bem a boca"],
      ["ɑ", "hot", "hɑt", "a bem aberto, lá no fundo da boca"],
      ["ɔ", "saw", "sɔ", "ó aberto, como em \"pó\""],
      ["ʊ", "book", "bʊk", "u curto e relaxado"],
      ["u", "blue", "blu", "u longo, como em \"tu\""],
      ["ʌ", "cup", "kʌp", "a curto e fechado, parecido com o \"a\" de \"cama\""],
      ["ə", "about", "əˈbaʊt", "vogal fraca e rápida, quase engolida; é o som mais comum do inglês"],
    ],
  },
  {
    title: "Vogais com R",
    note: "No inglês americano o R é pronunciado junto com a vogal, com a língua enrolada para trás.",
    sounds: [
      ["ɜr", "bird", "bɜrd", "um \"âr\" só, sem mexer a boca do começo ao fim"],
      ["ər", "water", "ˈwɔtər", "o mesmo som, só que fraco, no fim das palavras"],
      ["ɑr", "car", "kɑr", "a aberto seguido do R enrolado"],
      ["ɔr", "more", "mɔr", "ó aberto seguido do R enrolado"],
    ],
  },
  {
    title: "Ditongos",
    note: "Duas vogais que deslizam uma na outra, na mesma sílaba.",
    sounds: [
      ["eɪ", "day", "deɪ", "\"êi\", como em \"lei\""],
      ["aɪ", "my", "maɪ", "\"ai\", como em \"pai\""],
      ["ɔɪ", "boy", "bɔɪ", "\"ói\", como em \"dói\""],
      ["aʊ", "now", "naʊ", "\"au\", como em \"mau\""],
      ["oʊ", "go", "ɡoʊ", "\"ôu\", como em \"vou\""],
    ],
  },
  {
    title: "Consoantes que não existem em português",
    note: "São as que mais entregam o sotaque. Vale treinar uma por uma.",
    sounds: [
      ["θ", "think", "θɪŋk", "língua entre os dentes e sopre, sem voz. Não é \"f\" nem \"t\""],
      ["ð", "this", "ðɪs", "língua entre os dentes, com voz. Não é \"d\" nem \"z\""],
      ["ŋ", "sing", "sɪŋ", "o \"n\" de \"banco\", sem pronunciar o \"g\" no fim"],
      ["r", "red", "rɛd", "língua enrolada para trás, sem encostar em nada; nunca como o \"r\" de \"rato\""],
      ["h", "house", "haʊs", "um sopro leve, como o \"r\" de \"rato\" bem suave"],
    ],
  },
  {
    title: "Consoantes com símbolo diferente",
    note: "Os sons você já conhece; só o símbolo é novo.",
    sounds: [
      ["ʃ", "she", "ʃi", "\"ch\" de \"chá\""],
      ["ʒ", "measure", "ˈmɛʒər", "\"j\" de \"já\""],
      ["tʃ", "chair", "tʃɛr", "\"tch\", como o \"t\" de \"tia\" no sotaque carioca"],
      ["dʒ", "job", "dʒɑb", "\"dj\", como o \"d\" de \"dia\" no sotaque carioca"],
      ["j", "yes", "jɛs", "\"i\" rápido, como em \"iate\""],
      ["w", "we", "wi", "\"u\" rápido, como em \"uau\""],
    ],
  },
  {
    title: "Sinais de acento",
    note: "Em inglês, errar a sílaba forte atrapalha mais do que errar um som.",
    sounds: [
      ["ˈ", "today", "təˈdeɪ", "a sílaba depois do sinal é a mais forte: to-DAY"],
      ["ˌ", "understand", "ˌʌndərˈstænd", "acento secundário: um pouco forte, menos que a principal"],
    ],
  },
];

export const guideWords = () => IPA_GUIDE.flatMap((group) => group.sounds.map(([, word]) => word));
