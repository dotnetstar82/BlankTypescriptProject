import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

import {
  LIQUIDITY_STATE_LAYOUT_V4,
} from "@raydium-io/raydium-sdk";
import { OpenOrders } from "@project-serum/serum";

// raydium pool id can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";
const OPENBOOK_PROGRAM_ID = new PublicKey(
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"
);

export const getSOLPrice = async () => {
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

  // example to get pool info
  const info = await connection.getAccountInfo(new PublicKey(SOL_USDC_POOL_ID));
  if (!info) return null;

  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  const openOrders = await OpenOrders.load(
    connection,
    poolState.openOrders,
    OPENBOOK_PROGRAM_ID // OPENBOOK_PROGRAM_ID(marketProgramId) of each pool can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  );

  const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();

  const baseTokenAmount = await connection.getTokenAccountBalance(
    poolState.baseVault
  );
  const quoteTokenAmount = await connection.getTokenAccountBalance(
    poolState.quoteVault
  );

  const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
  const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;

  const openOrdersBaseTokenTotal =
    openOrders.baseTokenTotal.toNumber() / baseDecimal;
  const openOrdersQuoteTokenTotal =
    openOrders.quoteTokenTotal.toNumber() / quoteDecimal;

  const base =
    (baseTokenAmount.value?.uiAmount || 0) + openOrdersBaseTokenTotal - basePnl;
  const quote =
    (quoteTokenAmount.value?.uiAmount || 0) +
    openOrdersQuoteTokenTotal -
    quotePnl;

  console.log(
    "SOL_USDC pool info:",
    "\npool total base " + base,
    "\npool total quote " + quote,

    "\nbase vault balance " + baseTokenAmount.value.uiAmount,
    "\nquote vault balance " + quoteTokenAmount.value.uiAmount,

    "\nbase tokens in openorders " + openOrdersBaseTokenTotal,
    "\nquote tokens in openorders  " + openOrdersQuoteTokenTotal,

    "\nbase token decimals " + poolState.baseDecimal.toNumber(),
    "\nquote token decimals " + poolState.quoteDecimal.toNumber(),
  );

  console.log('Price', quote/base)
  console.log('Price', quotePnl/basePnl)
  console.log('Price', (quoteTokenAmount.value?.uiAmount || 0)/ (baseTokenAmount.value?.uiAmount || 1))
}

getSOLPrice();