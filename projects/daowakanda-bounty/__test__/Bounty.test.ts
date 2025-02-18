/* eslint-disable no-unused-vars */
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import algokit, { Config, getOrCreateKmdWalletAccount } from '@algorandfoundation/algokit-utils';
import algosdk, { makeBasicAccountTransactionSigner, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';
import { BountyClient, BountyFactory } from '../contracts/clients/BountyClient';

const fixture = algorandFixture();
Config.configure({ populateAppCallResources: true });

let appClient: BountyClient;
let admin: algosdk.Account;
let claimer: algosdk.Account;
const appAddress = '';

const mbrCostForBountyBox = 131_300;

describe('Bounty', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;
    const { algorand } = fixture;

    const factory = new BountyFactory({
      algorand,
      defaultSender: testAccount.addr,
    });

    const createResult = await factory.send.create.createApplication();

    admin = await getOrCreateKmdWalletAccount(
      {
        name: `first buyer${Math.floor(Math.random() * 10)}`,
        fundWith: algokit.algos(1000),
      },
      algorand.client.algod,
      algorand.client.kmd
    );

    claimer = await algokit.getOrCreateKmdWalletAccount(
      {
        name: `second buyer${Math.floor(Math.random() * 10)}`,
        fundWith: algokit.algos(10),
      },
      algorand.client.algod,
      algorand.client.kmd
    );

    appClient = createResult.appClient;

    // await appClient.appClient.fundAppAccount({ amount: algokit.microAlgos(100_000) });
  });

  test('issueBounty', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const bountyAmount = Number(algokit.algos(5).microAlgos);

    const totalAmount = bountyAmount + mbrCostForBountyBox;

    console.debug('totalAmount', totalAmount);

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: admin.addr,
      to: appClient.appClient.appAddress,
      amount: totalAmount,
      suggestedParams,
    });

    console.debug('claimer', claimer.addr);

    const response = await appClient.send.issueBounty({
      args: { payTxn: paymentTxn, amount: bountyAmount, addr: claimer.addr },
      sender: admin.addr,
      signer: makeBasicAccountTransactionSigner(admin),
      boxReferences: [
        {
          appId: appClient.appId,
          name: claimer.addr,
        },
      ],
      // extraFee
    });

    console.debug('response', response);
    // expect(response.confirmation).toBeDefined();
  });

  test('issueBounty twice', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const bountyAmount = Number(algokit.algos(10).microAlgos);

    const totalAmount = bountyAmount;

    console.debug('totalAmount', totalAmount);

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: admin.addr,
      to: appClient.appClient.appAddress,
      amount: totalAmount,
      suggestedParams,
    });

    console.debug('claimer', claimer.addr);

    const response = await appClient.send.issueBounty({
      args: { payTxn: paymentTxn, amount: bountyAmount, addr: claimer.addr },
      sender: admin.addr,
      signer: makeBasicAccountTransactionSigner(admin),
      boxReferences: [
        {
          appId: appClient.appId,
          name: claimer.addr,
        },
      ],
      // extraFee
    });

    console.debug('response', response);
    // expect(response.confirmation).toBeDefined();
  });

  test('claim', async () => {
    const { algorand } = fixture;
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    // const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
    //   from: admin.addr,
    //   to: appClient.appClient.appAddress,
    //   suggestedParams,
    // });

    console.debug('claimer', claimer.addr);

    const response = await appClient.send.claim({
      args: {},
      sender: admin.addr,
      signer: makeBasicAccountTransactionSigner(admin),
      boxReferences: [
        {
          appId: appClient.appId,
          name: claimer.addr,
        },
      ],
      extraFee: algokit.algos(0.002),
    });

    const { address, balance } = await algorand.account.getInformation(claimer.addr);

    console.debug('addr', address);
    console.debug('balance', balance);
    // expect(response.confirmation).toBeDefined();
  });
});
