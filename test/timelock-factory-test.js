const { expect } = require("chai");
const { ethers } = require("hardhat");


//now() -> secs since epoc
const now = _=> Math.floor(Date.now() / 1000);

//an arbitrary amount of tokens to be used in many places
const AMOUNT = 23; 


describe("Timelock Factory for ERC20 assets", function () {

    before(async function () {
        
        [this.alice, this.bob] = await ethers.getSigners();
        this.Token = await ethers.getContractFactory("TestToken");
        this.token = await this.Token.deploy(1000);
        await this.token.deployed();

        expect(await this.token.balanceOf(this.alice.address)).equal(1000);

        this.Factory = await ethers.getContractFactory("TimelockFactory");
        this.factory = await this.Factory.deploy(this.token.address);
        await this.factory.deployed();

        [this.alice, this.bob] = await ethers.getSigners();
    });


  it("create a first timelocked position for Alice", async function () {
    //create a timelocked position for 1h
    let tx = await this.factory.createNew(this.alice.address, now()+3600);
    await tx.wait();

    let position = await this.factory.positionByBeneficiary(this.alice.address,0);
    console.log(position);
    expect(await this.factory.counter()).equal(1);
    expect(await this.factory.countByBeneficiary(this.alice.address)).equal(1);
    //expect(await greeter.greet()).to.equal("Hola, mundo!");
  });

  it("create a first timelocked position for Bob", async function () {
    //create a timelocked position for 1h
    let tx = await this.factory.createNew(this.bob.address, now()+3600);
    let rcpt = await tx.wait();
    console.log('gas used:'+rcpt.gasUsed);
    

    expect(await this.factory.counter()).equal(2);
    expect(await this.factory.countByBeneficiary(this.bob.address)).equal(1);
    //expect(await greeter.greet()).to.equal("Hola, mundo!");
  });  

  it("create a second timelocked position for Alice", async function () {
    //create a timelocked position for 1h
    let tx = await this.factory.createNew(this.alice.address, now()+3600);
    await tx.wait();
    expect(await this.factory.counter()).equal(3);
    expect(await this.factory.countByBeneficiary(this.alice.address)).equal(2);
    //expect(await greeter.greet()).to.equal("Hola, mundo!");
  });

  it("browse all positions for Alice", async function () {
    //create a timelocked position for 1h
    let len = await this.factory.countByBeneficiary(this.alice.address);

    for (i=0; i<len ; i++)
        console.log(await this.factory.positionByBeneficiary(this.alice.address,i));

  });

  it("browse all positions all users", async function () {
    //create a timelocked position for 1h
    let len = await this.factory.counter();

    for (i=0; i<len ; i++)
        console.log(await this.factory.positions(i));
  });

  it("take Bob' position and fund with tokens", async function () {
    //create a timelocked position for 1h
    let position = await this.factory.positionByBeneficiary(this.bob.address, 0);
    console.log(position);
    let tx = await this.token.transfer(position,AMOUNT);
    await tx.wait();
    expect(await this.token.balanceOf(position)).equal(AMOUNT);
  });  

  it("Nor Alice neither Bob can unlock funds before time", async function () {
    //create a timelocked position for 1h
    let positionAddr = await this.factory.positionByBeneficiary(this.bob.address, 0);
    const TokenTimelock = await ethers.getContractFactory('TokenTimelock');
    const tokenTimelock = await TokenTimelock.attach(positionAddr)
    console.log(tokenTimelock);
    await expect(tokenTimelock.release()).to.be.reverted;
  }); 

  it("Anyone can unlock funds after due time, but only beneficiary gets them", async function () {
    //create a timelocked position for 1h




    let positionAddr = await this.factory.positionByBeneficiary(this.bob.address, 0);
    const TokenTimelock = await ethers.getContractFactory('TokenTimelock');
    const tokenTimelock = await TokenTimelock.attach(positionAddr);
    console.log(tokenTimelock);

    let time = parseInt((await tokenTimelock.releaseTime()).toString());
    console.log(time);

    await network.provider.send("evm_setNextBlockTimestamp", [time]);
    await network.provider.send("evm_mine")    


    let tx = await tokenTimelock.release();
    await tx.wait();
    expect(tx).to.be.ok;

    let balance = await this.token.balanceOf(this.bob.address);
    expect(balance).equal(AMOUNT);


  });   

});
