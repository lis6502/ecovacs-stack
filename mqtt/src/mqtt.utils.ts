export const getColoredConsoleLog = (topic: string) => {
  let color = 32;
  if (topic.includes('p2p')) {
    color = 36;
  }
  return `\x1b[${color}m[${topic}]\x1b[0m`;
};

export const isTopic = (query: string, topic: string) =>
  topic.search(query) >= 0 && process.env.BOTID && topic.search(process.env.BOTID) >= 0;

export const getDatafromMessage = (message: Buffer) => JSON.parse(message.toString()).body.data;
