const xrpl = require('xrpl');
// Adapted from Issue a Token on the XRP Ledger tutorial

async function main() {
    // Define the network client -----------------------------------------------
    const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233')
    console.log("Connecting to Testnet...")
    await client.connect()
  
    // Get credentials from the Testnet Faucet -----------------------------------
    console.log("Requesting addresses from the Testnet faucet...")
    const hot_wallet = (await client.fundWallet()).wallet
    const cold_wallet = (await client.fundWallet()).wallet
    console.log(`Got hot address ${hot_wallet.address} and cold address ${cold_wallet.address}.`)
  
    // Configure issuer (cold address) settings ----------------------------------
    const cold_settings_tx = {
      "TransactionType": "AccountSet",
      "Account": cold_wallet.address,
      "TransferRate": 0,
      "TickSize": 5,
      // Using tf flags, we can enable more flags in one transaction
      "Flags": (xrpl.AccountSetTfFlags.tfDisallowXRP)
    }
  
    const cst_prepared = await client.autofill(cold_settings_tx)
    const cst_signed = cold_wallet.sign(cst_prepared)
    console.log("Sending cold address AccountSet transaction...")
    const cst_result = await client.submitAndWait(cst_signed.tx_blob)
    if (cst_result.result.meta.TransactionResult == "tesSUCCESS") {
      console.log(`Transaction succeeded: https://testnet.xrpl.org/transactions/${cst_signed.hash}`)
    } else {
      throw `Error sending transaction: ${cst_result}`
    }
  
  
    // Configure hot address settings --------------------------------------------
  
    const hot_settings_tx = {
      "TransactionType": "AccountSet",
      "Account": hot_wallet.address,
      // enable Require Auth so we can't use trust lines that users
      // make to the hot address, even by accident:
      "SetFlag": xrpl.AccountSetAsfFlags.asfRequireAuth,
      "Flags": (xrpl.AccountSetTfFlags.tfDisallowXRP |
                xrpl.AccountSetTfFlags.tfRequireDestTag)
    }
  
    const hst_prepared = await client.autofill(hot_settings_tx)
    const hst_signed = hot_wallet.sign(hst_prepared)
    console.log("Sending hot address AccountSet transaction...")
    const hst_result = await client.submitAndWait(hst_signed.tx_blob)
    if (hst_result.result.meta.TransactionResult == "tesSUCCESS") {
      console.log(`Transaction succeeded: https://testnet.xrpl.org/transactions/${hst_signed.hash}`)
    } else {
      throw `Error sending transaction: ${hst_result.result.meta.TransactionResult}`
    }
  
  
    // Create trust line from hot to cold address --------------------------------
    const currency_code = "WQR"
    const hot_trust_set_tx = {
      "TransactionType": "TrustSet",
      "Account": hot_wallet.address,
      "LimitAmount": {
        "currency": currency_code,
        "issuer": cold_wallet.address,
        "value": "10000000000" // Large limit, arbitrarily chosen
      }
    }
  
    const hot_ts_prepared = await client.autofill(hot_trust_set_tx)
    const hot_ts_signed = hot_wallet.sign(hot_ts_prepared)
    console.log("Creating trust line from hot address to issuer...")
    const hot_ts_result = await client.submitAndWait(hot_ts_signed.tx_blob)
    if (hot_ts_result.result.meta.TransactionResult == "tesSUCCESS") {
      console.log(`Transaction succeeded: https://testnet.xrpl.org/transactions/${hot_ts_signed.hash}`)
    } else {
      throw `Error sending transaction: ${hot_ts_result.result.meta.TransactionResult}`
    }

    // Check trust line ----------------------------------------------------------
    const trustline = await client.request({
      command: 'account_lines',
      account: hot_wallet.address,
      ledger_index: 'validated',
      limit: 200,
      peer: cold_wallet.address,
      currency: currency_code
    });
    
    if (trustline.result.lines.length > 0) {
      console.log(`The hot address ${hot_wallet.address} has a trust line to the cold address ${cold_wallet.address} for the currency ${currency_code}`);
    } else {
      console.log(`The hot address ${hot_wallet.address} does not have a trust line to the cold address ${cold_wallet.address} for the currency ${currency_code}`);
    }

    // Send token ----------------------------------------------------------------
    const issue_quantity = "200"
    const send_token_tx = {
      "TransactionType": "Payment",
      "Account": cold_wallet.address,
      "Amount": {
        "currency": currency_code,
        "value": issue_quantity,
        "issuer": cold_wallet.address
      },
      "Destination": hot_wallet.address,
      "DestinationTag": 1 // Needed since we enabled Require Destination Tags
                          // on the hot account earlier.
    }
 
    const pay_prepared = await client.autofill(send_token_tx)
    const pay_signed = cold_wallet.sign(pay_prepared)
    console.log(`Sending ${issue_quantity} ${currency_code} to ${hot_wallet.address}...`)
    const pay_result = await client.submitAndWait(pay_signed.tx_blob)
    if (pay_result.result.meta.TransactionResult == "tesSUCCESS") {
      console.log(`Transaction succeeded: https://testnet.xrpl.org/transactions/${pay_signed.hash}`)
    } else {
      throw `Error sending transaction: ${pay_result.result.meta.TransactionResult}`
    }

    // Check balances ------------------------------------------------------------
    console.log("Getting hot address balances...")
    const hot_balances = await client.request({
      command: "account_lines",
      account: hot_wallet.address,
      ledger_index: "validated"
    })
    console.log(hot_balances.result)
  
    console.log("Getting cold address balances...")
    const cold_balances = await client.request({
      command: "gateway_balances",
      account: cold_wallet.address,
      ledger_index: "validated",
      hotwallet: [hot_wallet.address]
    })
    console.log(JSON.stringify(cold_balances.result, null, 2))
  
    client.disconnect()
  } // End of main()
  main()
