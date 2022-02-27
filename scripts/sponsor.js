const hre = require("hardhat");
const ethers = require("ethers");
const {
  FlashbotsBundleProvider,
  FlashbotsBundleResolution,
} = require("@flashbots/ethers-provider-bundle");
require('log-timestamp');

const BLOCKS_IN_FUTURE = 2;
const GWEI = ethers.BigNumber.from(10).pow(9);
const PRIORITY_GAS_PRICE = GWEI.mul(31)
const PRIVATE_KEY_SPONSOR = process.env.PRIVATE_KEY_1 || ""
const PRIVATE_KEY_EXECUTOR = process.env.PRIVATE_KEY_2 || ""

const FACTORY_ADDR = "0x0563EacF70D7030BFaB3a94437085838E65E1D47";
const FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "contract StarvingArtistMint",
        "name": "starvingArtistMint",
        "type": "address"
      }
    ],
    "name": "CreateStarvingArtistMint",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseURI",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "firstBuyer",
        "type": "address"
      }
    ],
    "name": "createStarvingArtistMint",
    "outputs": [
      {
        "internalType": "contract StarvingArtistMint",
        "name": "starvingArtistMint",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "implementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkSimulation(
  flashbotsProvider,
  signedBundle
) {
  const simulationResponse = await flashbotsProvider.simulate(
    signedBundle,
    "latest"
  );

  if ("results" in simulationResponse) {
    for (let i = 0; i < simulationResponse.results.length; i++) {
      const txSimulation = simulationResponse.results[i];
      if ("error" in txSimulation) {
        throw new Error(
          `TX #${i} : ${txSimulation.error} ${txSimulation.revert}`
        );
      }
    }

    if (simulationResponse.coinbaseDiff.eq(0)) {
      throw new Error("Does not pay coinbase");
    }

    const gasUsed = simulationResponse.results.reduce(
      (acc, txSimulation) => acc + txSimulation.gasUsed,
      0
    );

    const gasPrice = simulationResponse.coinbaseDiff.div(gasUsed);
    return gasPrice;
  }

  console.error(
    `Similuation failed, error code: ${simulationResponse.error.code}`
  );
  console.error(simulationResponse.error.message);
  throw new Error("Failed to simulate response");
}

async function main() {
  // setup wallets
  const walletExecutor = new ethers.Wallet(PRIVATE_KEY_EXECUTOR);
  const walletSponsor = new ethers.Wallet(PRIVATE_KEY_SPONSOR);
  const walletRelay = walletSponsor;

  console.log(`Executor Account: ${walletExecutor.address}`);
  console.log(`Sponsor Account: ${walletSponsor.address}`);
  console.log(`Relay Account: ${walletRelay.address}`);

  // setup providers
  const provider = new ethers.providers.InfuraProvider(5, process.env.INFURA_API_KEY || '');
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider, 
    walletRelay, 
    'https://relay-goerli.epheph.com/'
  );

  // create tx
  const Factory = new ethers.Contract(FACTORY_ADDR, FACTORY_ABI);
  const factory = await Factory.attach(FACTORY_ADDR);
  var sponsoredTransaction = await factory.populateTransaction.createStarvingArtistMint(
    "DummyStarvingArtist",
    "DummyStarvingArtist",
    "testURI",
    walletExecutor.address,
    walletSponsor.address
  );

  // Get block
  const block = await provider.getBlock("latest");

  // estimate gas
  const gasEstimate = await provider.estimateGas({
    sponsoredTransaction,
    from: walletExecutor.address
  });

  // get gas price
  const gasPrice = PRIORITY_GAS_PRICE.add(block.baseFeePerGas || 0);
  console.log(`Gas Price: ${gasPrice.mul(100).div(GWEI).toNumber() / 100} gwei`);

  console.log(`Gas Used: ${gasEstimate.toString()}`);

  // bundle tx 
  // TODO hardcode gas limit as there's some issue with gas estimation??
  var bundleTransactions = [
    {
      transaction: {
        to: walletExecutor.address,
        gasPrice: gasPrice,
        value: gasEstimate.mul(gasPrice),
        gasLimit: 3000000,
      },
      signer: walletSponsor
    },
    {
      transaction: {
        ...sponsoredTransaction,
        gasPrice: gasPrice,
        gasLimit: gasEstimate.add(200000)
      },
      signer: walletExecutor
    }
  ];

  const signedBundle = await flashbotsProvider.signBundle(bundleTransactions);
  var simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);

  // Execute on flashbots
  provider.on('block', async (blockNumber) => {
    simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);
    const targetBlockNumber = blockNumber + BLOCKS_IN_FUTURE;
    console.log(`Current Block Number: ${blockNumber},   Target Block Number:${targetBlockNumber},   gasPrice: ${simulatedGasPrice.mul(100).div(GWEI).toNumber() / 100} gwei`)
    const bundleResponse = await flashbotsProvider.sendBundle(bundleTransactions, targetBlockNumber);

    if ('error' in bundleResponse) {
      throw new Error(bundleResponse.error.message)
    }
    const bundleResolution = await bundleResponse.wait()
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
      console.log(`Congrats, included in ${targetBlockNumber}`)
      process.exit(0)
    } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      console.log(`Not included in ${targetBlockNumber}`)
    } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
      console.log("Nonce too high, bailing")
      process.exit(1)
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
