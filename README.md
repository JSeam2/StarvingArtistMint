# Starving Artist Mint 

This is a **non-production ready** experimental implementation of 0xngmi proposal regarding Counterfactural Minting/Sponsored Minting found in this [tweet](https://twitter.com/0xngmi/status/1447015858925195268)

## Motivations

The goal of Starving Artist Mint is to allow an artist to create a NFT collection by being sponsored through initial buyers. 
The goal is to give artists more autonomy and to not be reliant on Marketplace contracts like Opensea or Rarible.  

Gas in this case is subsidized by the initial buyer who would deploy the NFT contract via a clone and mint the first NFT for themselves. 

Flashbots relayers are used to help coordinate the sponsored transactions.

## Todos and Findings
1. Include a lazy minting functionality where an artist can sign something and 
allow someone else to mint for a fee. Right now subsequent mints are paid for by the artist.

2. Include a signature verification on the `StarvingArtistMintFactory` to prevent theft by the first minter.  

3. Add additional payment logic on the Factory and Clone contract. There's no payment logic at the moment.

4. Add ERC721Enumerable extension (optional as in eip721).

5. Using Clones results in the contract creator being the Factory contract. Also you can't read and write Cloned contracts on etherscan atm.

6. The Flashbot sponsor code requires the execution wallet (the wallet who isn't sponsoring the tx) to have sufficient eth to fund the transaction to be reimbursed later by the sponsor wallet.

## Goerli Deployments
StarvingArtistMint deployed to: 0x95e49076fdc6a1058F9d21910301A5f45e8642D9
StarvingArtistMintFactory deployed to: 0x0563EacF70D7030BFaB3a94437085838E65E1D47

## Quickstart
1. Run `yarn` to install dependencies

1. Set up `.env` by copying `.env.example`. You will need to seed `PRIVATE_KEY_1` with Goerli eth to test the contract on Goerli.

1. Install hardhat

1. Run `npx hardhat compile` to compile contracts.

1. Run `npx hardhat run scripts/deploy.js` to deploy contracts. Include `--network goerli` to deploy on Goerli.

1. Run `npx hardhat run scripts/sponsor.js --network goerli` to test with the flashbot provider on Goerli.

# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
