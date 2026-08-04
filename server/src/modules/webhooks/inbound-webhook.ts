export type InboundWebhook = {
  body: Buffer;
  headers: Array<{ name: string; value: string }>;
  method: string;
  query: string;
};
