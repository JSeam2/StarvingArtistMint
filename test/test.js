const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StarvingArtist", function () {
  let signers;
  let impl;
  let factory;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const Impl = await ethers.getContractFactory('StarvingArtistMint');
    impl = await Impl.deploy();
    await impl.deployed();

    const Factory = await ethers.getContractFactory('StarvingArtistMintFactory');
    factory = await Factory.deploy(impl.address);
    await factory.deployed();
  });

  it('It should initialize successfully', async function() {
    expect(await factory.implementation()).to.equal(impl.address);
    tx = await factory.createStarvingArtistMint(
      'test',
      'test',
      'test',
      signers[1].address,
      signers[2].address
    );
    let res = await tx.wait();
    // get address
    let address = res.events[1].args[0];

    const deployed = impl.attach(address);
    console.log(await deployed.name());
    expect(await deployed.name()).to.equal('test');
    expect(await deployed.symbol()).to.equal('test');
    expect(await deployed.baseURI()).to.equal('test');
    expect(await deployed.owner()).to.equal(signers[1].address);
    expect(await deployed.ownerOf(0)).to.equal(signers[2].address);
    expect(await deployed.balanceOf(signers[2].address)).to.equal(1);
    
  });
});
