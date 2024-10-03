import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk, {
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from 'algosdk';
import { DaoWakandaClient } from '../contracts/clients/DaoWakandaClient';

const fixture = algorandFixture();

let appClient: DaoWakandaClient;

describe('DaoWakanda', () => {
  beforeEach(fixture.beforeEach);
  const title = 'DaoWakanda';
  const description = 'This is a proposal';
  let registeredASA: bigint | undefined;
  let algod: algosdk.Algodv2;
  let sender: algosdk.Account;
  let sender2: algosdk.Account;
  let defaultAccount: algosdk.Account;
  let appAddress = '';

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod: algodServer, testAccount, kmd } = fixture.context;
    algod = algodServer;
    defaultAccount = testAccount;

    sender = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'dao-sender',
        fundWith: algokit.algos(10),
      },
      algod,
      kmd
    );

    sender2 = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'dao-sender-2',
        fundWith: algokit.algos(10),
      },
      algod,
      kmd
    );

    appClient = new DaoWakandaClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    const res = await appClient.create.createApplication({
      title,
      description,
      // endDate: Date.now() + 10 * 60 * 1000,
      // endDate: Date.now() - 10 * 60 * 1000,
      endDate: Date.now(),
    });

    appAddress = res.appAddress;
  });

  test('view title and description', async () => {
    const result = await appClient.getDaoDetails({});
    const returnValue = result.return;
    expect(result.return).toBeDefined();

    if (returnValue) {
      const [newTitle, newDescription, endDate, , , , , timestamp] = returnValue;
      console.debug('Timestamp', timestamp);
      console.debug('block time', new Date(Number(timestamp)).toString());
      console.debug('End date', endDate);
      console.debug('end time', new Date(Number(endDate)).toString());
      console.log('Time difference', (Number(endDate) - Number(timestamp)) / 1000, 'seconds');
      expect(newTitle).toEqual(title);
      expect(newDescription).toEqual(description);
    }
  });

  test('create ASA', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, algod);
    const transaction = makePaymentTxnWithSuggestedParamsFromObject({
      from: defaultAccount.addr,
      to: (await appClient.appClient.getAppReference()).appAddress,
      amount: 200_000,
      suggestedParams,
    });

    const result = await appClient.createDaoAsa(
      {
        minimumBalanceTransaction: {
          transaction,
          signer: defaultAccount,
        },
      },
      {
        sendParams: {
          fee: algokit.microAlgos(200_000),
        },
      }
    );

    registeredASA = result.return?.valueOf();
    expect(result.return).toBeDefined();
  });

  test('view registered ASA', async () => {
    const result = await appClient.getDaoDetails({});
    const returnValue = result.return;
    expect(result.return).toBeDefined();

    if (returnValue) {
      const [, , , , , , asa] = returnValue;
      expect(asa).toEqual(registeredASA);
    }
  });

  test('register', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, algod);
    const txn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: sender.addr,
      amount: 0,
      assetIndex: Number(registeredASA),
      suggestedParams,
    });

    console.debug('registered asa: ', registeredASA);

    await algokit.sendTransaction(
      {
        transaction: txn,
        from: sender,
      },
      algod
    );

    const accountInfoBefore = await algod.accountAssetInformation(sender.addr, Number(registeredASA)).do();
    console.debug(accountInfoBefore);

    const appInfoBefore = await algod.accountAssetInformation(appAddress, Number(registeredASA)).do();
    console.debug(appInfoBefore);

    await appClient.register(
      { registeredASA: BigInt(registeredASA!) },
      {
        sender,
        sendParams: {
          fee: algokit.microAlgos(3_000),
        },
      }
    );

    const accountInfo = await algod.accountAssetInformation(sender.addr, Number(registeredASA)).do();

    expect(accountInfo['asset-holding'].amount).toEqual(1);
  });

  test('register (negative)', async () => {
    await expect(
      appClient.register(
        { registeredASA: BigInt(registeredASA!) },
        {
          sender,
          sendParams: {
            fee: algokit.microAlgos(3_000),
          },
        }
      )
    ).rejects.toThrow();
  });

  test('register - second account', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, algod);
    const txn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender2.addr,
      to: sender2.addr,
      amount: 0,
      assetIndex: Number(registeredASA),
      suggestedParams,
    });

    await algokit.sendTransaction(
      {
        transaction: txn,
        from: sender2,
      },
      algod
    );

    await appClient.register(
      { registeredASA: BigInt(registeredASA!) },
      {
        sender: sender2,
        sendParams: {
          fee: algokit.microAlgos(3_000),
        },
      }
    );

    const accountInfo = await algod.accountAssetInformation(sender2.addr, Number(registeredASA)).do();

    expect(accountInfo['asset-holding'].amount).toEqual(1);
  });

  test('register - second account (negative)', async () => {
    await expect(
      appClient.register(
        { registeredASA: BigInt(registeredASA!) },
        {
          sender: sender2,
          sendParams: {
            fee: algokit.microAlgos(3_000),
          },
        }
      )
    ).rejects.toThrow();
  });

  test('vote - account 1', async () => {
    await appClient.vote(
      { registeredASA: BigInt(registeredASA!), inFavor: true },
      {
        sender,
        sendParams: {
          fee: algokit.microAlgos(4_000),
        },
      }
    );

    const result = await appClient.getDaoDetails({});
    const returnValue = result.return;

    const [, , , voteCount, yesVoteCount, noVoteCount] = returnValue!;

    expect(voteCount).toBe(BigInt(1));
    expect(yesVoteCount).toBe(BigInt(1));
    expect(noVoteCount).toBe(BigInt(0));
  });

  test('vote - account 1 - (negative)', async () => {
    await expect(
      appClient.vote(
        { registeredASA: BigInt(registeredASA!), inFavor: true },
        {
          sender,
          sendParams: {
            fee: algokit.microAlgos(4_000),
          },
        }
      )
    ).rejects.toThrow();
  });

  test('vote - account 2', async () => {
    await appClient.vote(
      { registeredASA: BigInt(registeredASA!), inFavor: false },
      {
        sender: sender2,
        sendParams: {
          fee: algokit.microAlgos(4_000),
        },
      }
    );

    const result = await appClient.getDaoDetails({});
    const returnValue = result.return;

    const [, , , voteCount, yesVoteCount, noVoteCount] = returnValue!;

    expect(voteCount).toBe(BigInt(2));
    expect(yesVoteCount).toBe(BigInt(1));
    expect(noVoteCount).toBe(BigInt(1));
  });

  test('vote - account 2 - (negative)', async () => {
    await expect(
      appClient.vote(
        { registeredASA: BigInt(registeredASA!), inFavor: true },
        {
          sender: sender2,
          sendParams: {
            fee: algokit.microAlgos(4_000),
          },
        }
      )
    ).rejects.toThrow();
  });

  test('End voting', async () => {
    await appClient.manuallyCloseVoting({});

    const result = await appClient.getDaoDetails({});
    const returnValue = result.return;
    const [, , endDate] = returnValue!;
    expect(endDate).toEqual(BigInt(0));
  });
});
