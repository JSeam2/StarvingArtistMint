const hre = require("hardhat");
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require('@flashbots/ethers-provider-bundle');


async function main() {
  const walletSponsor = new ethers.Wallet(process.env.PRIVATE_KEY_1);
  const walletExecutor = new ethers.Wallet(process.env.PRIVATE_KEY_2);

  // setup providers
  const provider = new ethers.providers.InfuraProvider(5, process.env.INFURA_API_KEY || '');
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider, 
    walletSponsor, 
    'https://relay-goerli.epheph.com/'
  );

  var bundleTransactions = [
    {
      transaction: {
        to: walletExecutor.address,
        gasPrice: 31,
        value: 5000,
        gasLimit: 21000,
      },
      signer: walletSponsor
    }
  ]

  // const signedBundle =  flashbotsProvider.signBundle([
  //   {
  //     signer: walletSponsor,
  //     transaction: signedTransactions
  //   }
  // ]);

  provider.on('block', async (blockNumber) => {
    const targetBlockNumber = blockNumber + 2;
    const bundleResponse = flashbotsProvider.sendBundle(bundleTransactions, targetBlockNumber);
    if ('error' in bundleResponse) {
      throw new Error(bundleResponse.error.message)
    }
    const bundleResolution = await bundleResponse;
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
      console.log(`Congrats, included in ${targetBlockNumber}`)
      process.exit(0)
    } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      console.log(`Not included in ${targetBlockNumber}`)
    } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
      console.log("Nonce too high, bailing")
      process.exit(1)
    }

  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
