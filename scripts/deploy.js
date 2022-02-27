const hre = require("hardhat");

async function main() {
  const Impl = await hre.ethers.getContractFactory("StarvingArtistMint");
  const impl = await Impl.deploy();
  await impl.deployed();
  console.log("StarvingArtistMint deployed to:", impl.address);

  const Factory = await hre.ethers.getContractFactory("StarvingArtistMintFactory");
  const factory = await Factory.deploy(impl.address);
  await factory.deployed();
  console.log("StarvingArtistMintFactory deployed to:", factory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
