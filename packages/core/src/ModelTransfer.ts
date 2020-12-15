export abstract class ModelTransfer<IOB, TB> implements BFChainComlink.ModelTransfer<IOB, TB> {
  abstract Any2InOutBinary(obj: unknown): IOB;
  abstract InOutBinary2Any(bin: IOB): unknown;
  abstract linkObj2TransferableBinary(obj: BFChainComlink.LinkObj<IOB>): TB;
  abstract transferableBinary2LinkObj(bin: TB): BFChainComlink.LinkObj<IOB>;
}
