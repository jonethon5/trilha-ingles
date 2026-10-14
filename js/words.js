// Baralho de palavras em contexto: os 50 verbos mais usados do inglês, cada um em cinco frases.
// A ideia é aprender a palavra vendo-a em situações diferentes, e não decorando uma tradução solta.
//
// Cada palavra: [palavra, tradução curta, formas que aparecem nas frases, cinco frases [inglês, português]].

const DATA = [
  ["get", "pegar, conseguir, ficar, chegar", "get gets got getting", [
    ["I get up at six.", "Eu me levanto às seis."],
    ["Can you get me some water?", "Você pode pegar um pouco de água para mim?"],
    ["She got a new job.", "Ela conseguiu um emprego novo."],
    ["It is getting cold.", "Está ficando frio."],
    ["What time did you get home?", "Que horas você chegou em casa?"],
  ]],
  ["have", "ter", "have has had having", [
    ["I have a question.", "Eu tenho uma pergunta."],
    ["She has a headache.", "Ela está com dor de cabeça."],
    ["We had lunch together.", "Nós almoçamos juntos."],
    ["Do you have a minute?", "Você tem um minuto?"],
    ["I am having a great time.", "Eu estou me divertindo muito."],
  ]],
  ["go", "ir", "go goes went going gone", [
    ["I go to the gym every day.", "Eu vou à academia todos os dias."],
    ["She went home early.", "Ela foi para casa cedo."],
    ["Let's go for a walk.", "Vamos dar uma caminhada."],
    ["How is it going?", "Como vão as coisas?"],
    ["The pain is gone.", "A dor passou."],
  ]],
  ["make", "fazer", "make makes made making", [
    ["I will make dinner tonight.", "Eu vou fazer o jantar hoje à noite."],
    ["She made a mistake.", "Ela cometeu um erro."],
    ["This song makes me happy.", "Esta música me deixa feliz."],
    ["We need to make a decision.", "Nós precisamos tomar uma decisão."],
    ["He makes a lot of money.", "Ele ganha muito dinheiro."],
  ]],
  ["take", "pegar, levar, tomar", "take takes took taking taken", [
    ["Take your umbrella.", "Leve o seu guarda-chuva."],
    ["I took the bus to work.", "Eu peguei o ônibus para o trabalho."],
    ["It takes ten minutes.", "Leva dez minutos."],
    ["She is taking a shower.", "Ela está tomando banho."],
    ["Can you take a picture of us?", "Você pode tirar uma foto nossa?"],
  ]],
  ["want", "querer", "want wants wanted", [
    ["I want a cup of coffee.", "Eu quero uma xícara de café."],
    ["She wants to travel.", "Ela quer viajar."],
    ["What do you want to eat?", "O que você quer comer?"],
    ["He wanted to help.", "Ele queria ajudar."],
    ["I don't want to be late.", "Eu não quero me atrasar."],
  ]],
  ["need", "precisar", "need needs needed", [
    ["I need your help.", "Eu preciso da sua ajuda."],
    ["She needs a new phone.", "Ela precisa de um celular novo."],
    ["We need to talk.", "Nós precisamos conversar."],
    ["You don't need to worry.", "Você não precisa se preocupar."],
    ["He needed more time.", "Ele precisava de mais tempo."],
  ]],
  ["know", "saber, conhecer", "know knows knew known", [
    ["I know the answer.", "Eu sei a resposta."],
    ["Do you know her?", "Você a conhece?"],
    ["I don't know where he is.", "Eu não sei onde ele está."],
    ["She knew the truth.", "Ela sabia a verdade."],
    ["Let me know if you need anything.", "Me avise se você precisar de alguma coisa."],
  ]],
  ["think", "pensar, achar", "think thinks thought thinking", [
    ["I think you are right.", "Eu acho que você tem razão."],
    ["What do you think about it?", "O que você acha disso?"],
    ["I am thinking about my family.", "Eu estou pensando na minha família."],
    ["She thought it was a joke.", "Ela achou que era uma piada."],
    ["Let me think for a moment.", "Deixe-me pensar por um momento."],
  ]],
  ["like", "gostar", "like likes liked", [
    ["I like this song.", "Eu gosto desta música."],
    ["She likes to read.", "Ela gosta de ler."],
    ["Would you like some tea?", "Você gostaria de um pouco de chá?"],
    ["He doesn't like vegetables.", "Ele não gosta de legumes."],
    ["I liked the movie a lot.", "Eu gostei muito do filme."],
  ]],
  ["look", "olhar, parecer", "look looks looked looking", [
    ["Look at this picture.", "Olhe para esta foto."],
    ["You look tired.", "Você parece cansado."],
    ["I am looking for my keys.", "Eu estou procurando as minhas chaves."],
    ["She looked at me and smiled.", "Ela olhou para mim e sorriu."],
    ["It looks like rain.", "Parece que vai chover."],
  ]],
  ["see", "ver", "see sees saw seen seeing", [
    ["I can see the ocean from here.", "Eu consigo ver o mar daqui."],
    ["Did you see that?", "Você viu aquilo?"],
    ["See you later.", "Até mais tarde."],
    ["I saw her at the store.", "Eu a vi na loja."],
    ["I see what you mean.", "Eu entendo o que você quer dizer."],
  ]],
  ["come", "vir", "come comes came coming", [
    ["Come here, please.", "Venha aqui, por favor."],
    ["She came to the party.", "Ela veio à festa."],
    ["Where do you come from?", "De onde você vem?"],
    ["I am coming home now.", "Eu estou indo para casa agora."],
    ["Summer is coming.", "O verão está chegando."],
  ]],
  ["give", "dar", "give gives gave given giving", [
    ["Give me a second.", "Me dê um segundo."],
    ["She gave me a book.", "Ela me deu um livro."],
    ["Don't give up.", "Não desista."],
    ["He gives good advice.", "Ele dá bons conselhos."],
    ["Can you give me a ride?", "Você pode me dar uma carona?"],
  ]],
  ["work", "trabalhar, funcionar", "work works worked working", [
    ["I work from home.", "Eu trabalho de casa."],
    ["My phone is not working.", "O meu celular não está funcionando."],
    ["She works at a bank.", "Ela trabalha em um banco."],
    ["It worked very well.", "Funcionou muito bem."],
    ["I have a lot of work today.", "Eu tenho muito trabalho hoje."],
  ]],
  ["tell", "contar, dizer", "tell tells told telling", [
    ["Tell me the truth.", "Me diga a verdade."],
    ["She told me a story.", "Ela me contou uma história."],
    ["Can you tell me the time?", "Você pode me dizer as horas?"],
    ["I told you so.", "Eu te avisei."],
    ["He is telling a joke.", "Ele está contando uma piada."],
  ]],
  ["say", "dizer", "say says said saying", [
    ["What did you say?", "O que você disse?"],
    ["She says she is busy.", "Ela diz que está ocupada."],
    ["He said goodbye and left.", "Ele disse tchau e foi embora."],
    ["How do you say this in English?", "Como se diz isto em inglês?"],
    ["I have nothing to say.", "Eu não tenho nada a dizer."],
  ]],
  ["find", "encontrar, achar", "find finds found finding", [
    ["I can't find my wallet.", "Eu não consigo encontrar a minha carteira."],
    ["She found a good restaurant.", "Ela encontrou um bom restaurante."],
    ["Did you find your keys?", "Você achou as suas chaves?"],
    ["I find this book interesting.", "Eu acho este livro interessante."],
    ["We need to find a solution.", "Nós precisamos encontrar uma solução."],
  ]],
  ["call", "ligar, chamar", "call calls called calling", [
    ["Call me tomorrow.", "Me ligue amanhã."],
    ["She called a taxi.", "Ela chamou um táxi."],
    ["What do you call this?", "Como você chama isto?"],
    ["I will call you back.", "Eu te ligo de volta."],
    ["He is calling his mother.", "Ele está ligando para a mãe dele."],
  ]],
  ["try", "tentar, experimentar", "try tries tried trying", [
    ["Try again.", "Tente de novo."],
    ["I am trying to learn English.", "Eu estou tentando aprender inglês."],
    ["She tried the cake.", "Ela experimentou o bolo."],
    ["You should try this restaurant.", "Você deveria experimentar este restaurante."],
    ["He tries hard every day.", "Ele se esforça todos os dias."],
  ]],
  ["ask", "perguntar, pedir", "ask asks asked asking", [
    ["Can I ask you a question?", "Posso te fazer uma pergunta?"],
    ["She asked for help.", "Ela pediu ajuda."],
    ["He asked me my name.", "Ele perguntou o meu nome."],
    ["Don't be afraid to ask.", "Não tenha medo de perguntar."],
    ["I am asking for a favor.", "Eu estou pedindo um favor."],
  ]],
  ["feel", "sentir", "feel feels felt feeling", [
    ["I feel good today.", "Eu me sinto bem hoje."],
    ["How do you feel?", "Como você se sente?"],
    ["She felt tired after work.", "Ela se sentiu cansada depois do trabalho."],
    ["I feel like eating pizza.", "Eu estou com vontade de comer pizza."],
    ["This shirt feels soft.", "Esta camisa é macia."],
  ]],
  ["leave", "sair, deixar", "leave leaves left leaving", [
    ["I leave home at seven.", "Eu saio de casa às sete."],
    ["She left her bag on the bus.", "Ela deixou a bolsa no ônibus."],
    ["We are leaving tomorrow.", "Nós vamos embora amanhã."],
    ["Leave me alone.", "Me deixe em paz."],
    ["He left without saying goodbye.", "Ele saiu sem se despedir."],
  ]],
  ["put", "colocar", "put puts putting", [
    ["Put the book on the table.", "Coloque o livro na mesa."],
    ["She put on her coat.", "Ela vestiu o casaco."],
    ["Where did you put my phone?", "Onde você colocou o meu celular?"],
    ["Put your shoes away.", "Guarde os seus sapatos."],
    ["He puts sugar in his coffee.", "Ele coloca açúcar no café."],
  ]],
  ["keep", "manter, continuar, guardar", "keep keeps kept keeping", [
    ["Keep the change.", "Fique com o troco."],
    ["She keeps her room clean.", "Ela mantém o quarto limpo."],
    ["Keep going.", "Continue."],
    ["I kept the letter.", "Eu guardei a carta."],
    ["Can you keep a secret?", "Você consegue guardar um segredo?"],
  ]],
  ["let", "deixar", "let lets let's letting", [
    ["Let me help you.", "Deixe-me ajudar você."],
    ["Let's go home.", "Vamos para casa."],
    ["She let me use her car.", "Ela me deixou usar o carro dela."],
    ["Don't let the dog out.", "Não deixe o cachorro sair."],
    ["Let me see.", "Deixe-me ver."],
  ]],
  ["help", "ajudar", "help helps helped helping", [
    ["Can I help you?", "Posso ajudar você?"],
    ["She helped me with my homework.", "Ela me ajudou com a lição de casa."],
    ["This app helps me learn.", "Este app me ajuda a aprender."],
    ["I need some help.", "Eu preciso de ajuda."],
    ["Thank you for helping me.", "Obrigado por me ajudar."],
  ]],
  ["talk", "conversar, falar", "talk talks talked talking", [
    ["We need to talk about it.", "Nós precisamos conversar sobre isso."],
    ["She talks too fast.", "Ela fala rápido demais."],
    ["I talked to him yesterday.", "Eu falei com ele ontem."],
    ["Who are you talking to?", "Com quem você está falando?"],
    ["Let's talk later.", "Vamos conversar mais tarde."],
  ]],
  ["start", "começar", "start starts started starting", [
    ["The movie starts at eight.", "O filme começa às oito."],
    ["I started a new book.", "Eu comecei um livro novo."],
    ["Let's start again.", "Vamos começar de novo."],
    ["She is starting a new job.", "Ela está começando em um emprego novo."],
    ["When did it start?", "Quando começou?"],
  ]],
  ["stop", "parar", "stop stops stopped stopping", [
    ["Stop the car.", "Pare o carro."],
    ["It stopped raining.", "Parou de chover."],
    ["She never stops talking.", "Ela nunca para de falar."],
    ["The bus stops here.", "O ônibus para aqui."],
    ["I can't stop laughing.", "Eu não consigo parar de rir."],
  ]],
  ["show", "mostrar", "show shows showed showing", [
    ["Show me your hands.", "Me mostre as suas mãos."],
    ["She showed me the way.", "Ela me mostrou o caminho."],
    ["Let me show you something.", "Deixe-me te mostrar uma coisa."],
    ["The map shows the city.", "O mapa mostra a cidade."],
    ["I watched a good show last night.", "Eu assisti a um bom programa ontem à noite."],
  ]],
  ["play", "jogar, tocar, brincar", "play plays played playing", [
    ["The kids are playing outside.", "As crianças estão brincando lá fora."],
    ["He plays the piano.", "Ele toca piano."],
    ["Do you want to play a game?", "Você quer jogar um jogo?"],
    ["We played soccer on Sunday.", "Nós jogamos futebol no domingo."],
    ["Play that song again.", "Toque aquela música de novo."],
  ]],
  ["live", "morar, viver", "live lives lived living", [
    ["I live in Brazil.", "Eu moro no Brasil."],
    ["She lives alone.", "Ela mora sozinha."],
    ["We lived there for two years.", "Nós moramos lá por dois anos."],
    ["Where do you live?", "Onde você mora?"],
    ["He is living his dream.", "Ele está vivendo o sonho dele."],
  ]],
  ["bring", "trazer", "bring brings brought bringing", [
    ["Bring your friends.", "Traga os seus amigos."],
    ["She brought a cake.", "Ela trouxe um bolo."],
    ["Can you bring me the menu?", "Você pode me trazer o cardápio?"],
    ["He always brings good news.", "Ele sempre traz boas notícias."],
    ["What brings you here?", "O que traz você aqui?"],
  ]],
  ["buy", "comprar", "buy buys bought buying", [
    ["I want to buy a car.", "Eu quero comprar um carro."],
    ["She bought a new dress.", "Ela comprou um vestido novo."],
    ["Where did you buy that?", "Onde você comprou isso?"],
    ["He buys bread every morning.", "Ele compra pão todas as manhãs."],
    ["I am buying a gift for her.", "Eu estou comprando um presente para ela."],
  ]],
  ["pay", "pagar", "pay pays paid paying", [
    ["I will pay for dinner.", "Eu vou pagar o jantar."],
    ["She paid the bill.", "Ela pagou a conta."],
    ["Can I pay with cash?", "Posso pagar em dinheiro?"],
    ["He pays his rent on time.", "Ele paga o aluguel em dia."],
    ["Pay attention, please.", "Preste atenção, por favor."],
  ]],
  ["wait", "esperar", "wait waits waited waiting", [
    ["Wait for me.", "Espere por mim."],
    ["I am waiting for a call.", "Eu estou esperando uma ligação."],
    ["She waited for an hour.", "Ela esperou por uma hora."],
    ["I can't wait to see you.", "Eu mal posso esperar para ver você."],
    ["Wait a minute.", "Espere um minuto."],
  ]],
  ["meet", "encontrar, conhecer", "meet meets met meeting", [
    ["Let's meet at the park.", "Vamos nos encontrar no parque."],
    ["I met her last year.", "Eu a conheci no ano passado."],
    ["I want you to meet my friend.", "Eu quero que você conheça o meu amigo."],
    ["She meets her friends on Fridays.", "Ela encontra os amigos às sextas."],
    ["We have a meeting at nine.", "Nós temos uma reunião às nove."],
  ]],
  ["learn", "aprender", "learn learns learned learning", [
    ["I am learning to cook.", "Eu estou aprendendo a cozinhar."],
    ["She learns very fast.", "Ela aprende muito rápido."],
    ["I learned a new word today.", "Eu aprendi uma palavra nova hoje."],
    ["Where did you learn that?", "Onde você aprendeu isso?"],
    ["It is never too late to learn.", "Nunca é tarde demais para aprender."],
  ]],
  ["understand", "entender", "understand understands understood", [
    ["I understand you.", "Eu entendo você."],
    ["Do you understand me?", "Você me entende?"],
    ["She understood the lesson.", "Ela entendeu a lição."],
    ["I don't understand this word.", "Eu não entendo esta palavra."],
    ["He understands Spanish.", "Ele entende espanhol."],
  ]],
  ["remember", "lembrar", "remember remembers remembered", [
    ["I remember that day.", "Eu me lembro daquele dia."],
    ["Do you remember me?", "Você se lembra de mim?"],
    ["She remembered my birthday.", "Ela se lembrou do meu aniversário."],
    ["I can't remember his name.", "Eu não consigo lembrar o nome dele."],
    ["Remember to lock the door.", "Lembre-se de trancar a porta."],
  ]],
  ["change", "mudar, trocar", "change changes changed changing", [
    ["I need to change my clothes.", "Eu preciso trocar de roupa."],
    ["She changed her mind.", "Ela mudou de ideia."],
    ["Things change fast.", "As coisas mudam rápido."],
    ["He changed jobs last month.", "Ele mudou de emprego no mês passado."],
    ["The weather is changing.", "O tempo está mudando."],
  ]],
  ["open", "abrir", "open opens opened opening", [
    ["Open the door, please.", "Abra a porta, por favor."],
    ["The store opens at nine.", "A loja abre às nove."],
    ["She opened the window.", "Ela abriu a janela."],
    ["Is the bank open today?", "O banco está aberto hoje?"],
    ["I can't open this bottle.", "Eu não consigo abrir esta garrafa."],
  ]],
  ["close", "fechar", "close closes closed closing", [
    ["Close your eyes.", "Feche os olhos."],
    ["The shop closes at six.", "A loja fecha às seis."],
    ["She closed the book.", "Ela fechou o livro."],
    ["The restaurant is closed today.", "O restaurante está fechado hoje."],
    ["Please close the door.", "Por favor, feche a porta."],
  ]],
  ["use", "usar", "use uses used using", [
    ["Can I use your phone?", "Posso usar o seu celular?"],
    ["She uses this app every day.", "Ela usa este app todos os dias."],
    ["I used all the milk.", "Eu usei todo o leite."],
    ["He is using my computer.", "Ele está usando o meu computador."],
    ["What do you use this for?", "Para que você usa isto?"],
  ]],
  ["eat", "comer", "eat eats ate eating eaten", [
    ["I eat breakfast at seven.", "Eu tomo café da manhã às sete."],
    ["She ate all the cake.", "Ela comeu o bolo todo."],
    ["Let's eat out tonight.", "Vamos comer fora hoje à noite."],
    ["He eats too fast.", "Ele come rápido demais."],
    ["We are eating dinner now.", "Nós estamos jantando agora."],
  ]],
  ["drink", "beber", "drink drinks drank drinking", [
    ["I drink a lot of water.", "Eu bebo muita água."],
    ["She drank a glass of juice.", "Ela bebeu um copo de suco."],
    ["Would you like something to drink?", "Você gostaria de algo para beber?"],
    ["He doesn't drink coffee.", "Ele não bebe café."],
    ["Let's have a drink.", "Vamos tomar alguma coisa."],
  ]],
  ["sleep", "dormir", "sleep sleeps slept sleeping", [
    ["I sleep seven hours a night.", "Eu durmo sete horas por noite."],
    ["The baby is sleeping.", "O bebê está dormindo."],
    ["She slept on the sofa.", "Ela dormiu no sofá."],
    ["Did you sleep well?", "Você dormiu bem?"],
    ["I need more sleep.", "Eu preciso dormir mais."],
  ]],
  ["read", "ler", "read reads reading", [
    ["I read before bed.", "Eu leio antes de dormir."],
    ["She is reading a magazine.", "Ela está lendo uma revista."],
    ["Did you read my message?", "Você leu a minha mensagem?"],
    ["He reads the news every morning.", "Ele lê as notícias todas as manhãs."],
    ["I like reading in the park.", "Eu gosto de ler no parque."],
  ]],
  ["write", "escrever", "write writes wrote writing written", [
    ["Write your name here.", "Escreva o seu nome aqui."],
    ["She wrote me a letter.", "Ela me escreveu uma carta."],
    ["I am writing an email.", "Eu estou escrevendo um e-mail."],
    ["He writes very well.", "Ele escreve muito bem."],
    ["How do you write this word?", "Como se escreve esta palavra?"],
  ]],
];

export const CONTEXTS_PER_WORD = 5;

export const WORDS = DATA.map(([word, pt, forms, contexts]) => ({
  id: word,
  word,
  pt,
  forms: forms.split(" "),
  cards: contexts.map(([en, sentencePt], i) => ({ id: `w-${word}-${i + 1}`, wordId: word, en, pt: sentencePt })),
}));

export const wordById = new Map(WORDS.map((w) => [w.id, w]));

// Separa a frase em pedaços, marcando os que são a palavra estudada (em qualquer forma),
// para a tela poder destacá-la.
export function highlight(word, sentence) {
  const pattern = new RegExp(`\\b(${[...word.forms].sort((a, b) => b.length - a.length).join("|")})\\b`, "gi");
  const parts = [];
  let last = 0;
  for (const match of sentence.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: sentence.slice(last, match.index), hit: false });
    parts.push({ text: match[0], hit: true });
    last = match.index + match[0].length;
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last), hit: false });
  return parts;
}
