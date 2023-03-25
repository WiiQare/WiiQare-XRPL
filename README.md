# WiiQare-XRPL
This is the repository hosting the proof-of-concept code for our XRPL solution. 

## Design Overview
WiiQare is a remittance platform for healthcare in Africa. WiiQare aims to reduce remittance fees and increase speed of transfer by using crypto as an intermediary. Our platform consists of a user interface for migrants, beneficiaries, and member hospitals allowing for seamless healthcare remittances. In terms of the on-chain part of our solution, we are considering multiple approaches. Currently, we have decided on a fungible token approach. 
The payments flow currently looks like the following:

![XRPL Architecture and Payments Flow](xrpl-architecture.png)

This repository holds a proof-of-concept for the XRPL token issuance architecture. Internally, we use a token (WQT) pegged to USD/EUR that we use for the internal accounting of remittance funds, as well as on-chain transparency of funds for our users. Note that this token only has value within WiiQare's network, although this could change in the future. This token allows us to credit users with funds and have funds immediately available for presentation at partnered healthcare facilities. 

## Code Walkthrough

As stated earlier, this is a simple proof-of-concept for the issuance architecture. We first initialize and XRPL account and fund it, this is the cold_wallet. This account will issue WQR. Similarly, we initialize our hot wallet (hot_wallet) and fund it, enabling authorized trust lines on this account to restrict the token to WiiQare's internal network. Then, the issuer account (cold_wallet) sends WQR to the WiiQare hot wallet. 

