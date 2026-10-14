// Onde fica o arquivo de áudio de cada coisa. Usado pelo app e pela ferramenta que gera os áudios,
// para os dois concordarem sempre nos nomes.

export const sentenceFile = (id) => `s/${id}.mp3`;
export const speakingFile = (id) => `p/${id}.mp3`;
export const vocabFile = (lessonId, index) => `v/${lessonId}-${index + 1}.mp3`;

// "I'm" -> w/i_m.mp3, "o'clock" -> w/o_clock.mp3
export function wordFile(word) {
  const slug = word
    .toLowerCase()
    .replace(/[’']/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `w/${slug}.mp3`;
}
