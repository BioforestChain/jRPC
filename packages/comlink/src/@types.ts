declare namespace BFChainComlink {
  type ComlinkOptions = {
    // async: boolean;
    magic: boolean;
  };

  interface DuplexFactory {
    create(): Channel.Duplex<ComlinkProtocol.TB>;
  }
  //   () => {
  //     duplex1: Channel.Duplex;
  //     duplex2: Channel.Duplex;
  //   };
}
