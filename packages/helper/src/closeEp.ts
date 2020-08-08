export const isMessagePort = (
  endpoint: BFChainComlink.Endpoint
): endpoint is MessagePort => endpoint instanceof MessagePort;

export const closeEndPoint = (endpoint: BFChainComlink.Endpoint<unknown>) => {
  if (endpoint instanceof MessagePort) endpoint.close();
};
