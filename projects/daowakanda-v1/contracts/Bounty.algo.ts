import { Contract } from '@algorandfoundation/tealscript';

// interface Metadata {
//   amount: uint64;
// }

const COST_PER_BYTE = 400;
const COST_PER_BOX = 2500;
const MBR = 100_000;

export class Bounty extends Contract {
  bountyBox = BoxMap<Address, uint64>();

  createApplication(): void {}

  issueBounty(payTxn: PayTxn, amount: uint64, addr: Address) {
    assert(amount > 0, 'amount must be greater than zero');

    const totalCost = MBR + COST_PER_BOX + COST_PER_BYTE * (8 + 64);

    verifyPayTxn(payTxn, {
      sender: this.txn.sender,
      receiver: this.app.address,
      amount: totalCost + amount,
    });

    this.bountyBox(addr).value = amount;
  }

  // claim() {
  //   const addr = this.txn.sender;
  //   assert(this.bounty(addr).exists, 'Sorry, you have no bounty to claim');

  //   const box = this.bounty(addr).value;

  //   const bountyAmount = box.amount;
  //   assert(bountyAmount > 0, 'No bounty available to claim');

  //   sendPayment({
  //     amount: bountyAmount,
  //     sender: this.app.address,
  //     receiver: this.txn.sender,
  //     note: 'Bounty claimed',
  //   });

  //   box.amount = 0;
  // }
}
