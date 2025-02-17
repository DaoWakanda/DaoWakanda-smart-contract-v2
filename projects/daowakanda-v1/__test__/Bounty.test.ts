import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk, { makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';
import { BountyClient } from '../contracts/clients/BountyClient';

const fixture = algorandFixture();

let appClient: BountyClient;
let admin: algosdk.Account;
let claimer: algosdk.Account;
let appAddress = '';

const mbrCostForBountyBox = 131_300;

describe('Bounty', () => {
  beforeEach(fixture.beforeEach);
  let algod: algosdk.Algodv2;

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod: algodServer, testAccount, kmd } = fixture.context;
    algod = algodServer;

    admin = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'dao-sender',
        fundWith: algokit.algos(50),
      },
      algod,
      kmd
    );

    claimer = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'dao-sender-2',
        fundWith: algokit.algos(10),
      },
      algod,
      kmd
    );

    appClient = new BountyClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    const res = await appClient.create.createApplication({});

    appAddress = res.appAddress;
  });

  test('issueBounty', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const bountyAmount = Number(algokit.algos(1).microAlgos);

    const totalAmount = bountyAmount + mbrCostForBountyBox;

    console.debug('totalAmount', totalAmount);

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: admin.addr,
      to: appAddress,
      amount: totalAmount,
      suggestedParams,
    });

    console.debug('claimer', claimer.addr);

    const { appId } = await appClient.appClient.getAppReference();

    const response = await appClient.issueBounty(
      { payTxn: paymentTxn, amount: bountyAmount, addr: claimer.addr },
      {
        sender: admin,
        sendParams: {
          fee: algokit.microAlgos(3_000),
        },
        boxes: [
          {
            appId,
            name: claimer.addr,
          },
        ],
      }
    );

    console.debug('response', response);
    // expect(response.confirmation).toBeDefined();
  });
});
