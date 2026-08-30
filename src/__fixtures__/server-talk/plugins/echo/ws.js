export default async (message) => `echo:${JSON.parse(message).payload}`;
