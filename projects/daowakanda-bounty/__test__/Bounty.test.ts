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

const mbrCostForBountyBox = 118_500;

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

    // await appClient.appClient.fundAppAccount({ amount: algokit.microAlgos(10_262_600) });

    await algorand.send.payment({
      receiver: appClient.appClient.appAddress,
      sender: admin.addr,
      // amount: algokit.microAlgos(10_000_000),
      signer: algosdk.makeBasicAccountTransactionSigner(admin),
      amount: algokit.microAlgos(10_118_500),
    })
  });

  // test('issueBounty (with payment)', async () => {
  //   const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

  //   const bountyAmount = Number(algokit.algos(5).microAlgos);

  //   const totalAmount = bountyAmount + mbrCostForBountyBox;

  //   console.debug('totalAmount', totalAmount);

  //   const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
  //     from: admin.addr,
  //     to: appClient.appClient.appAddress,
  //     amount: totalAmount,
  //     suggestedParams,
  //   });

  //   console.debug('claimer', claimer.addr);

  //   const response = await appClient.send.issueBounty({
  //     args: { payTxn: paymentTxn, amount: bountyAmount, addr: claimer.addr },
  //     sender: admin.addr,
  //     signer: makeBasicAccountTransactionSigner(admin),
  //     boxReferences: [
  //       {
  //         appId: appClient.appId,
  //         name: claimer.addr,
  //       },
  //     ],
  //     // extraFee
  //   });

  //   const globalState = await appClient.appClient.getGlobalState();
  //   console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
  //   console.debug(globalState.lockedAmount);
    
  //   // expect(response.confirmation).toBeDefined();
  // });

  // test('issueBounty twice (with payment)', async () => {
  //   const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

  //   const bountyAmount = Number(algokit.algos(10).microAlgos);

  //   const totalAmount = bountyAmount;

  //   console.debug('totalAmount', totalAmount);

  //   const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
  //     from: admin.addr,
  //     to: appClient.appClient.appAddress,
  //     amount: totalAmount,
  //     suggestedParams,
  //   });

  //   console.debug('claimer', claimer.addr);

  //   const response = await appClient.send.issueBounty({
  //     args: { payTxn: paymentTxn, amount: bountyAmount, addr: claimer.addr },
  //     sender: admin.addr,
  //     signer: makeBasicAccountTransactionSigner(admin),
  //     boxReferences: [
  //       {
  //         appId: appClient.appId,
  //         name: claimer.addr,
  //       },
  //     ],
  //     // extraFee
  //   });

  //   const globalState = await appClient.appClient.getGlobalState();
  //   console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
  //   console.debug(globalState.lockedAmount);

  //   // expect(response.confirmation).toBeDefined();
  // });

  // 
  test('issueBounty', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const bountyAmount = Number(algokit.algos(5).microAlgos);

    console.debug('claimer', claimer.addr);

    const response = await appClient.send.issueBountyWithoutPayment({
      args: { amount: bountyAmount, addr: claimer.addr },
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

    const globalState = await appClient.appClient.getGlobalState();
    console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
    console.debug(globalState.lockedAmount);
    
    // expect(response.confirmation).toBeDefined();
  });

  test('issueBounty twice', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const bountyAmount = Number(algokit.algos(5).microAlgos);

    const totalAmount = bountyAmount;

    console.debug('totalAmount', totalAmount);
    console.debug('claimer', claimer.addr);

    const response = await appClient.send.issueBountyWithoutPayment({
      args: { amount: bountyAmount, addr: claimer.addr },
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

    const globalState = await appClient.appClient.getGlobalState();
    console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
    console.debug(globalState.lockedAmount);

    // expect(response.confirmation).toBeDefined();
  });

  test('claim part', async () => {
    console.debug('claimer', claimer.addr);

    const response = await appClient.send.claimBounty({
      args: { amount: algokit.algos(5).microAlgos },
      sender: claimer.addr,
      signer: makeBasicAccountTransactionSigner(claimer),
      boxReferences: [
        {
          appId: appClient.appId,
          name: claimer.addr,
        },
      ],
      extraFee: algokit.microAlgos(1000),
    });

    expect(response.txIds).toBeDefined();

    const globalState = await appClient.appClient.getGlobalState();
    console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
    console.debug(globalState.lockedAmount);
  });

  test('claim remaining', async () => {
    console.debug('claimer', claimer.addr);

    const response = await appClient.send.claimBounty({
      args: { amount: algokit.algos(5).microAlgos },
      sender: claimer.addr,
      signer: makeBasicAccountTransactionSigner(claimer),
      boxReferences: [
        {
          appId: appClient.appId,
          name: claimer.addr,
        },
      ],
      extraFee: algokit.microAlgos(1000),
    });

    expect(response.txIds).toBeDefined();

    const globalState = await appClient.appClient.getGlobalState();
    console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
    console.debug(globalState.lockedAmount);
  });

  // test('claim part', async () => {
  //   console.debug('claimer', claimer.addr);

  //   const response = await appClient.send.claimBounty({
  //     args: { amount: algokit.algos(10).microAlgos },
  //     sender: claimer.addr,
  //     signer: makeBasicAccountTransactionSigner(claimer),
  //     boxReferences: [
  //       {
  //         appId: appClient.appId,
  //         name: claimer.addr,
  //       },
  //     ],
  //     extraFee: algokit.microAlgos(1000),
  //   });

  //   expect(response.txIds).toBeDefined();

  //   const globalState = await appClient.appClient.getGlobalState();
  //   console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
  //   console.debug(globalState.lockedAmount);
  // });

  // test('claim remaining', async () => {
  //   console.debug('claimer', claimer.addr);

  //   const response = await appClient.send.claimBounty({
  //     args: { amount: algokit.algos(5).microAlgos },
  //     sender: claimer.addr,
  //     signer: makeBasicAccountTransactionSigner(claimer),
  //     boxReferences: [
  //       {
  //         appId: appClient.appId,
  //         name: claimer.addr,
  //       },
  //     ],
  //     extraFee: algokit.microAlgos(1000),
  //   });

  //   expect(response.txIds).toBeDefined();

  //   const globalState = await appClient.appClient.getGlobalState();
  //   console.log(await fixture.algorand.client.algod.accountInformation(appClient.appAddress).do());
  //   console.debug(globalState.lockedAmount);
  // });

  // test('claim when no bounty', async () => {
  //   await expect(appClient.send.claimBounty({
  //     args: { amount: algokit.algos(10).microAlgos },
  //     sender: claimer.addr,
  //     signer: makeBasicAccountTransactionSigner(claimer),
  //     boxReferences: [
  //       {
  //         appId: appClient.appId,
  //         name: claimer.addr,
  //       },
  //     ],
  //     extraFee: algokit.algos(0.002),
  //   })).rejects.toBeDefined();
  // });

  test('claim when no bounty', async () => {
    await expect(appClient.send.claimBounty({
      args: { amount: algokit.algos(10).microAlgos },
      sender: claimer.addr,
      signer: makeBasicAccountTransactionSigner(claimer),
      boxReferences: [
        {
          appId: appClient.appId,
          name: claimer.addr,
        },
      ],
      extraFee: algokit.algos(0.002),
    })).rejects.toBeDefined();
  });
});
