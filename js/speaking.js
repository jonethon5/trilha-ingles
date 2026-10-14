// Frases do treino de fala, por nível do Quadro Europeu (CEFR).
// Cada frase é [inglês, português, IPA]. O IPA (Alfabeto Fonético Internacional) segue a pronúncia
// americana e tem uma transcrição por palavra, na mesma ordem, para aparecer embaixo de cada uma.

export const LEVELS = [
  {
    id: "a1",
    name: "A1",
    title: "Iniciante",
    desc: "Frases curtas do dia a dia",
    sentences: [
      ["Good morning.", "Bom dia.", "ɡʊd ˈmɔrnɪŋ"],
      ["How are you?", "Como você está?", "haʊ ɑr ju"],
      ["Thank you very much.", "Muito obrigado.", "θæŋk ju ˈvɛri mʌtʃ"],
      ["What is your name?", "Qual é o seu nome?", "wʌt ɪz jʊr neɪm"],
      ["I like coffee.", "Eu gosto de café.", "aɪ laɪk ˈkɔfi"],
      ["Where is the bathroom?", "Onde fica o banheiro?", "wɛr ɪz ðə ˈbæθrum"],
      ["I am from Brazil.", "Eu sou do Brasil.", "aɪ æm frʌm brəˈzɪl"],
      ["Nice to meet you.", "Prazer em conhecer você.", "naɪs tə mit ju"],
      ["I don't understand.", "Eu não entendo.", "aɪ doʊnt ˌʌndərˈstænd"],
      ["Can you help me?", "Você pode me ajudar?", "kæn ju hɛlp mi"],
      ["See you tomorrow.", "Até amanhã.", "si ju təˈmɑroʊ"],
      ["I am very hungry.", "Eu estou com muita fome.", "aɪ æm ˈvɛri ˈhʌŋɡri"],
    ],
  },
  {
    id: "a2",
    name: "A2",
    title: "Básico",
    desc: "Rotina, passado simples e pedidos",
    sentences: [
      ["I usually wake up at seven.", "Eu geralmente acordo às sete.", "aɪ ˈjuʒuəli weɪk ʌp æt ˈsɛvən"],
      ["What did you do yesterday?", "O que você fez ontem?", "wʌt dɪd ju du ˈjɛstərdeɪ"],
      ["I would like a glass of water.", "Eu gostaria de um copo de água.", "aɪ wʊd laɪk ə ɡlæs ʌv ˈwɔtər"],
      ["She is three years older than me.", "Ela é três anos mais velha do que eu.", "ʃi ɪz θri jɪrz ˈoʊldər ðæn mi"],
      ["We are going to travel next month.", "Nós vamos viajar no mês que vem.", "wi ɑr ˈɡoʊɪŋ tə ˈtrævəl nɛkst mʌnθ"],
      ["How much does this shirt cost?", "Quanto custa esta camisa?", "haʊ mʌtʃ dʌz ðɪs ʃɜrt kɔst"],
      ["I think this is the right address.", "Eu acho que este é o endereço certo.", "aɪ θɪŋk ðɪs ɪz ðə raɪt ˈædrɛs"],
      ["They live in a small village.", "Eles moram em uma vila pequena.", "ðeɪ lɪv ɪn ə smɔl ˈvɪlɪdʒ"],
      ["The weather is beautiful today.", "O tempo está lindo hoje.", "ðə ˈwɛðər ɪz ˈbjutəfəl təˈdeɪ"],
      ["I bought these shoes last Thursday.", "Eu comprei estes sapatos na quinta passada.", "aɪ bɔt ðiz ʃuz læst ˈθɜrzdeɪ"],
      ["Could you speak more slowly, please?", "Você poderia falar mais devagar, por favor?", "kʊd ju spik mɔr ˈsloʊli pliz"],
      ["I have never been to London.", "Eu nunca estive em Londres.", "aɪ hæv ˈnɛvər bɪn tə ˈlʌndən"],
    ],
  },
  {
    id: "b1",
    name: "B1",
    title: "Intermediário",
    desc: "Frases mais longas e tempos compostos",
    sentences: [
      ["I have been studying English for three years.", "Eu estudo inglês há três anos.", "aɪ hæv bɪn ˈstʌdiɪŋ ˈɪŋɡlɪʃ fɔr θri jɪrz"],
      ["If it rains tomorrow, we will stay home.", "Se chover amanhã, nós vamos ficar em casa.", "ɪf ɪt reɪnz təˈmɑroʊ wi wɪl steɪ hoʊm"],
      ["She told me that she was tired.", "Ela me disse que estava cansada.", "ʃi toʊld mi ðæt ʃi wʌz ˈtaɪərd"],
      ["I used to play soccer when I was a child.", "Eu costumava jogar futebol quando era criança.", "aɪ just tə pleɪ ˈsɑkər wɛn aɪ wʌz ə tʃaɪld"],
      ["This is the best movie I have ever seen.", "Este é o melhor filme que eu já vi.", "ðɪs ɪz ðə bɛst ˈmuvi aɪ hæv ˈɛvər sin"],
      ["I am looking forward to the weekend.", "Eu estou ansioso pelo fim de semana.", "aɪ æm ˈlʊkɪŋ ˈfɔrwərd tə ðə ˈwikɛnd"],
      ["Although it was late, we kept working.", "Embora fosse tarde, nós continuamos trabalhando.", "ɔlˈðoʊ ɪt wʌz leɪt wi kɛpt ˈwɜrkɪŋ"],
      ["Would you mind opening the window?", "Você se importaria de abrir a janela?", "wʊd ju maɪnd ˈoʊpənɪŋ ðə ˈwɪndoʊ"],
      ["I would rather walk than take the bus.", "Eu prefiro ir a pé a pegar o ônibus.", "aɪ wʊd ˈræðər wɔk ðæn teɪk ðə bʌs"],
      ["The meeting was cancelled because of the weather.", "A reunião foi cancelada por causa do tempo.", "ðə ˈmitɪŋ wʌz ˈkænsəld bɪˈkɔz ʌv ðə ˈwɛðər"],
      ["I think both of them are worth it.", "Eu acho que os dois valem a pena.", "aɪ θɪŋk boʊθ ʌv ðɛm ɑr wɜrθ ɪt"],
      ["You should have called me earlier.", "Você deveria ter me ligado mais cedo.", "ju ʃʊd hæv kɔld mi ˈɜrliər"],
    ],
  },
  {
    id: "b2",
    name: "B2",
    title: "Avançado",
    desc: "Estruturas complexas e palavras difíceis",
    sentences: [
      ["Had I known about the traffic, I would have left earlier.", "Se eu soubesse do trânsito, teria saído mais cedo.", "hæd aɪ noʊn əˈbaʊt ðə ˈtræfɪk aɪ wʊd hæv lɛft ˈɜrliər"],
      ["The more you practice, the more comfortable you will feel.", "Quanto mais você pratica, mais confortável vai se sentir.", "ðə mɔr ju ˈpræktɪs ðə mɔr ˈkʌmftərbəl ju wɪl fil"],
      ["She is thoroughly prepared for the interview.", "Ela está totalmente preparada para a entrevista.", "ʃi ɪz ˈθɜroʊli prɪˈpɛrd fɔr ði ˈɪntərvju"],
      ["It is worth considering other alternatives.", "Vale a pena considerar outras alternativas.", "ɪt ɪz wɜrθ kənˈsɪdərɪŋ ˈʌðər ɔlˈtɜrnətɪvz"],
      ["I can't help wondering what would have happened.", "Não consigo deixar de imaginar o que teria acontecido.", "aɪ kænt hɛlp ˈwʌndərɪŋ wʌt wʊd hæv ˈhæpənd"],
      ["The government is expected to announce new measures.", "Espera-se que o governo anuncie novas medidas.", "ðə ˈɡʌvərnmənt ɪz ɪkˈspɛktɪd tə əˈnaʊns nu ˈmɛʒərz"],
      ["Despite the difficulties, they managed to succeed.", "Apesar das dificuldades, eles conseguiram ter sucesso.", "dɪˈspaɪt ðə ˈdɪfɪkəltiz ðeɪ ˈmænɪdʒd tə səkˈsid"],
      ["Not only did he apologize, but he also paid for the damage.", "Ele não só pediu desculpas, como também pagou pelo prejuízo.", "nɑt ˈoʊnli dɪd hi əˈpɑlədʒaɪz bʌt hi ˈɔlsoʊ peɪd fɔr ðə ˈdæmɪdʒ"],
      ["I would appreciate it if you could let me know.", "Eu agradeceria se você pudesse me avisar.", "aɪ wʊd əˈpriʃieɪt ɪt ɪf ju kʊd lɛt mi noʊ"],
      ["The research suggests that sleep affects our memory.", "A pesquisa sugere que o sono afeta a nossa memória.", "ðə ˈrisɜrtʃ səɡˈdʒɛsts ðæt slip əˈfɛkts aʊər ˈmɛməri"],
      ["By the time we arrived, the concert had already started.", "Quando nós chegamos, o show já tinha começado.", "baɪ ðə taɪm wi əˈraɪvd ðə ˈkɑnsərt hæd ɔlˈrɛdi ˈstɑrtɪd"],
      ["She has a particularly sophisticated vocabulary.", "Ela tem um vocabulário particularmente sofisticado.", "ʃi hæz ə pərˈtɪkjələrli səˈfɪstɪkeɪtɪd voʊˈkæbjəlɛri"],
    ],
  },
];

// Palavras da frase, com a pontuação junto, para casar com as transcrições do IPA.
export function words(en) {
  return en.split(/\s+/).filter(Boolean);
}

export function flatSpeaking(levels = LEVELS) {
  return levels.flatMap((level) =>
    level.sentences.map(([en, pt, ipa], i) => ({
      id: `${level.id}-${String(i + 1).padStart(2, "0")}`,
      level: level.id,
      en,
      pt,
      ipa: ipa.split(" "),
    })),
  );
}
