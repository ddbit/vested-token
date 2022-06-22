const { expect } = require("chai");
const { ethers, network } = require("hardhat");


var token, vestedtoken, timelock, alice, bob, charlie, emitter;




describe("Vested Token", function () {


  before(async function () {
      this.Vestedtoken = await ethers.getContractFactory("VestedToken");
      this.Token = await ethers.getContractFactory("TestToken");
    
      [emitter, alice, bob, charlie] = await ethers.getSigners();

      let now = Math.floor(Date.now() / 1000);
      timelock = now + 3600;//timelock is 1h from now

      this.showBalances=async function(){

        [emitter, alice, bob, charlie,vestedtoken].forEach(async a=>{
          
          var bal = await token.balanceOf(a.address);
          console.log(a.address+":"+bal.toString());
        });
        
        
      };
  });

  beforeEach(async function () {
      token = await this.Token.deploy(1000);
      await token.deployed();
      
      vestedtoken = await this.Vestedtoken.deploy(
        token.address,
        alice.address, 
        emitter.address,
        timelock
      );
      await vestedtoken.deployed();

      //move some tokens to the vestedtoken contract
      tx = await token.transfer(vestedtoken.address, 100);
      await tx.wait();

      //console.log(tx);
      let balance = await token.balanceOf(vestedtoken.address);
      //console.log(balance);
      expect(balance).to.be.equal(100,"must be 100");
      
  });  

  it("Should prevent any transfer during timelock", async function () {
    
    let fromAlice = await vestedtoken.connect(alice);
    await expect( fromAlice.transfer(bob.address,1)).to.be.reverted;
  });

  it("Should allow transfer after timelock", async function () {
    console.log("blocktime:"+(await hre.ethers.provider.getBlock("latest")).timestamp);
    await network.provider.send("evm_setNextBlockTimestamp", [timelock + 1]);
    await network.provider.send("evm_mine") // this one will have 2021-07-01 12:00 AM as its timestamp, no matter what the previous block has
    console.log("blocktime:"+(await hre.ethers.provider.getBlock("latest")).timestamp);
    let fromAlice = await vestedtoken.connect(alice);
    
    let tx = await fromAlice.transfer(bob.address,1);
    await tx.wait();
    expect(tx).to.be.ok;
    let bobBalance = await token.balanceOf(bob.address);
    


    let balance = await token.balanceOf(vestedtoken.address);
    //console.log(balance);
    expect(balance).to.be.equal(99,"must be 100");   
    expect(bobBalance.toString()).to.be.equal("1","must be 1"); 

  });
  it("Should allow emitter to bypass timelock", async function () {
    let fromEmitter = await vestedtoken.connect(emitter);
    let b0 = await token.balanceOf(vestedtoken.address);
    let b1 = await token.balanceOf(alice.address);

    let tx = await fromEmitter.earlyUnlock();
    await tx.wait();
    let a0 = await token.balanceOf(vestedtoken.address);
    let a1 = await token.balanceOf(alice.address);

    expect(b0).to.be.eq(a1);
    expect(b1).to.be.eq(a0);

  });  
  it("Should show metadata and balance as any erc20", async function () {
    let name = await vestedtoken.name();
    let symbol = await vestedtoken.symbol();
    let decimals = await vestedtoken.decimals();
    expect(name).to.be.eq("Davide Token_locked");
    expect(symbol).to.be.eq("DAVlk");
    expect(decimals).to.be.eq(18);
  });

  it("Only beneficiary can spend after timelock", async function () {
    let timelock = (await hre.ethers.provider.getBlock("latest")).timestamp + 3600;
    await network.provider.send("evm_setNextBlockTimestamp", [timelock + 1]);
    await network.provider.send("evm_mine");
    let fromCharlie = await vestedtoken.connect(charlie);
    let fromAlice = await vestedtoken.connect(alice);
    let tx = await fromAlice.transfer(bob.address,1);
    await tx.wait();
    expect(tx).to.be.ok;
    await expect( fromCharlie.transfer(bob.address,1)).to.be.reverted;


  });  

  
});
