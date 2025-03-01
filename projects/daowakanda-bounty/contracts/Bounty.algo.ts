import { Contract } from '@algorandfoundation/tealscript';

const COST_PER_BYTE = 400;
const COST_PER_BOX = 2500;
const MBR = 100_000;

export class Bounty extends Contract {
  bountyBox = BoxMap<Address, uint64>();

  issueBounty(payTxn: PayTxn, amount: uint64, addr: Address) {
    assert(amount > 0, 'amount must be greater than zero');

    const totalCost = MBR + COST_PER_BOX + COST_PER_BYTE * (8 + 64);

    if (this.bountyBox(addr).exists) {
      verifyPayTxn(payTxn, {
        sender: this.txn.sender,
        receiver: this.app.address,
        amount: amount,
      });

      this.bountyBox(addr).value = this.bountyBox(addr).value + amount;
    } else {
      verifyPayTxn(payTxn, {
        sender: this.txn.sender,
        receiver: this.app.address,
        amount: totalCost + amount,
      });

      this.bountyBox(addr).value = amount;
    }
  }

  claimBounty(amount: uint64) {
    const addr = this.txn.sender;
    assert(this.bountyBox(addr).exists, 'Sorry, you have no bounty to claim');
    assert(amount > 0, 'Invalid bounty amount');

    const unclaimedAmount = this.bountyBox(addr).value;
    assert(unclaimedAmount >= amount, 'No bounty available to claim');

    sendPayment({
      amount: amount,
      sender: this.app.address,
      receiver: this.txn.sender,
      note: 'Bounty claimed',
    });

    this.bountyBox(addr).value = unclaimedAmount - amount;
  }
}
