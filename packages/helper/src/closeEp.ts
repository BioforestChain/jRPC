export const closeEndPoint = (endpoint: BFChainComlink.Endpoint<unknown>) => {
  endpoint.close && endpoint.close();
};
