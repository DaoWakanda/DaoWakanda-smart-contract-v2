/* eslint-disable no-unused-vars */
import { Contract } from '@algorandfoundation/tealscript';

export class DaoWakanda extends Contract {
  title = GlobalStateKey<string>();

  description = GlobalStateKey<string>();

  endDate = GlobalStateKey<uint64>();

  voteCount = GlobalStateKey<uint64>();

  yesVoteCount = GlobalStateKey<uint64>();

  registeredASA = GlobalStateKey<AssetID>();

  noVoteCount = GlobalStateKey<uint64>();

  /**
   * This creates a new Dao.
   * @param title The title of the new Dao.
   * @param description The description of the new DAO.
   * @param endDate The timestamp of the end date.
   */
  createApplication(title: string, description: string, endDate: uint64): void {
    this.title.value = title;
    this.description.value = description;
    this.endDate.value = endDate;
  }

  /**
   * This returns all the information of the DAO in this order:
   * title, description, endDate, voteCount, yesVoteCount, noVoteCount, registeredASA
   * @returns Dao Details
   */
  getDaoDetails(): [string, string, uint64, uint64, uint64, uint64, AssetID, uint64] {
    return [
      this.title.value,
      this.description.value,
      this.endDate.value,
      this.voteCount.value,
      this.yesVoteCount.value,
      this.noVoteCount.value,
      this.registeredASA.value,
      globals.latestTimestamp * 1000,
    ];
  }

  /**
   * This method creates the associated ASA for the DAO.
   * @param minimumBalanceTransaction Transaction that pays the minimum balance amount
   * into the contract
   * @returns Asset ID
   */
  createDaoASA(minimumBalanceTransaction: PayTxn): AssetID {
    verifyTxn(this.txn, { sender: this.app.creator });
    assert(this.endDate.value > globals.latestTimestamp * 1000, 'Voting has ended.');
    assert(!this.registeredASA.exists);
    assert(
      minimumBalanceTransaction.sender === this.txn.sender,
      'The mbr sender must be the same as the creator of the DAO'
    );

    assert(
      minimumBalanceTransaction.receiver === this.app.address,
      'The mbr receiver must be the same as the address of the DAO'
    );

    assert(
      minimumBalanceTransaction.amount > globals.assetCreateMinBalance,
      'The mbr amount must be greater than the minimum balance'
    );

    const registeredASA = sendAssetCreation({
      configAssetTotal: 1_000_000,
      configAssetName: 'DAOWAKANDA_VOTING',
      configAssetFreeze: this.app.address,
    });

    this.registeredASA.value = registeredASA;
    return registeredASA;
  }

  /**
   * Registers an address as a voter for the DAO.
   * @param registeredASA ASA ID of DAO Asa.
   */
  register(registeredASA: AssetReference): void {
    assert(this.registeredASA.exists);
    assert(this.txn.sender.assetBalance(this.registeredASA.value.id) === 0);
    assert(this.endDate.value > globals.latestTimestamp * 1000, 'Voting has ended.');

    sendAssetTransfer({
      xferAsset: this.registeredASA.value,
      assetAmount: 1,
      assetReceiver: this.txn.sender,
    });

    sendAssetFreeze({
      freezeAsset: this.registeredASA.value,
      freezeAssetFrozen: true,
      freezeAssetAccount: this.txn.sender,
    });
  }

  /**
   * Casts a vote.
   * @param registeredASA Asset ID for DAO ASA.
   * @param inFavor Indicates whether the vote is in favor of
   * or against the proposal.
   */
  vote(registeredASA: AssetReference, inFavor: boolean): void {
    assert(this.registeredASA.exists);
    assert(this.endDate.value > globals.latestTimestamp * 1000, 'Voting has ended.');

    // Check that user has 1 unit of the ASA.
    assert(
      this.txn.sender.assetBalance(this.registeredASA.value) === 1,
      'User is ineligible to vote as they have either not registered or already casted a vote.'
    );

    // Unfreeze the asset in the voter's wallet
    sendAssetFreeze({
      freezeAsset: this.registeredASA.value,
      freezeAssetFrozen: false,
      freezeAssetAccount: this.txn.sender,
    });

    // Send an additional 1 unit of the voting asset to make user's balance 2.
    sendAssetTransfer({
      xferAsset: this.registeredASA.value,
      assetAmount: 1,
      assetReceiver: this.txn.sender,
    });

    // Freeze the asset in voter's wallet.
    sendAssetFreeze({
      freezeAsset: this.registeredASA.value,
      freezeAssetFrozen: true,
      freezeAssetAccount: this.txn.sender,
    });

    this.voteCount.value = this.voteCount.value + 1;

    if (inFavor) {
      this.yesVoteCount.value = this.yesVoteCount.value + 1;
    } else {
      this.noVoteCount.value = this.noVoteCount.value + 1;
    }
  }

  manuallyCloseVoting(): void {
    assert(this.txn.sender === this.app.creator, 'Only the creator is allowed to close the voting process.');

    this.endDate.value = 0;
  }
}
