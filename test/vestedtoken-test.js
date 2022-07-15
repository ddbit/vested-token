const { expect, assert } = require("chai");
const { ethers, network } = require("hardhat");


var token, vestedtoken, cliffEndTime, vestingEndTime, alice, bob, charlie, emitter;




describe("With Vested Token", function () {


  before(async function () {
      this.Vestedtoken = await ethers.getContractFactory("VestedToken");
      this.Token = await ethers.getContractFactory("TestToken");
    
      [emitter, alice, bob, charlie] = await ethers.getSigners();

      let now = Math.floor(Date.now() / 1000);
      cliffEndTime   = now + 3600;//clieff is 1h from now
      vestingEndTime = now + 7200;//vesting ends 2h from now

      this.showBalances=async function(){

        [emitter, alice, bob, charlie,vestedtoken].forEach(async a=>{
          
          var bal = await token.balanceOf(a.address);
          console.log(a.address+":"+bal.toString());
        });
        
        
      };
  });

  beforeEach(async function () {
      let time = (await hre.ethers.provider.getBlock("latest")).timestamp;
      console.log("\tblocktime:"+time);
      console.log("\tcliff expired:"+(time > cliffEndTime));
      console.log("\tvesting expired:"+(time > vestingEndTime));

      token = await this.Token.deploy(1000);
      await token.deployed();
      
      vestedtoken = await this.Vestedtoken.deploy(
        token.address,
        alice.address, 
        emitter.address,
        cliffEndTime,
        vestingEndTime
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

  const strangerNoSpend = async function () {
    let fromCharlie = await vestedtoken.connect(charlie);
    await expect( fromCharlie.transfer(bob.address,1)).to.be.reverted;
  }

  const aliceNoSpend = async function () {
    let fromAlice = await vestedtoken.connect(alice);
    await expect( fromAlice.transfer(bob.address,1)).to.be.reverted;
  }

  const aliceCanSpend = async function () {      
    let fromAlice = await vestedtoken.connect(alice);
    let tx = await fromAlice.transfer(bob.address,1);
    await tx.wait();
    expect(tx).to.be.ok;
    let bobBalance = await token.balanceOf(bob.address);
    let balance = await token.balanceOf(vestedtoken.address);
    //console.log(balance);
    expect(balance).to.be.equal(99,"must be 100");   
    expect(bobBalance.toString()).to.be.equal("1","must be 1"); 
  }

  const emitterEarlyUnlock = async function () {
    let fromEmitter = await vestedtoken.connect(emitter);
    let b0 = await token.balanceOf(vestedtoken.address);
    let b1 = await token.balanceOf(alice.address);

    let tx = await fromEmitter.earlyUnlock();
    await tx.wait();
    let a0 = await token.balanceOf(vestedtoken.address);
    let a1 = await token.balanceOf(alice.address);

    expect(b0).to.be.eq(a1);
    expect(b1).to.be.eq(a0);
  };

  const emitterCanRecall = async function(){
    let fromEmitter = await vestedtoken.connect(emitter);
    let balanceContractBefore = await token.balanceOf(vestedtoken.address);
    let balanceEmitterBefore = await token.balanceOf(emitter.address);

    let tx = await fromEmitter.pullBack();
    await tx.wait();
    let balanceContractAfter = await token.balanceOf(vestedtoken.address);
    let balanceEmitterAfter = await token.balanceOf(emitter.address);

    expect(balanceContractAfter).to.be.eq(0);
    expect(balanceEmitterAfter).to.be.eq(balanceContractBefore.add(balanceEmitterBefore));

  }

  const emitterCannotRecall = async function(){
    let fromEmitter = await vestedtoken.connect(emitter);
    await expect(fromEmitter.pullBack()).to.be.reverted;
  }

  describe("Anytime the token itself", async  function(){
    it("Should show metadata as any erc20", async function () {

      let name = await vestedtoken.name();
      let symbol = await vestedtoken.symbol();
      let decimals = await vestedtoken.decimals();
      expect(name).to.be.eq("Davide Token_locked");
      expect(symbol).to.be.eq("DAVlk");
      expect(decimals).to.be.eq(18);
    });

    it("Should have supply equal to its balance on proxied token", async function () {});

  });

  describe("During cliff time", async function(){
    
      it("Any stranger shall not be able to spend", async function () {
        await strangerNoSpend();
      });

      it("Even the beneficiary Alice shall not be able to spend", async function () {
        await aliceNoSpend();
      });

      it("The emitter can recall tokens to him", async function () {
        await emitterCanRecall();
      });

      it("The emitter can early unlock to beneficiary", async function () {
        await emitterEarlyUnlock();
      });

  });
  


  describe("After cliff time is passed but during vesting", async function(){
    

    it("The beneficiary shall not be able to spend yet", async function () {
      let time = cliffEndTime + 1;
      await network.provider.send("evm_setNextBlockTimestamp", [time]);
      await network.provider.send("evm_mine") // this one will have 2021-07-01 12:00 AM as its timestamp, no matter what the previous block has
      console.log("\tblocktime:"+(await hre.ethers.provider.getBlock("latest")).timestamp);
      await aliceNoSpend();
    });

    it("The emitter can anytime early unlock to beneficiary", async function () {
      await emitterEarlyUnlock();
    });    

    it("The emitter cannot recall tokens to him any longer", async function () {
      await emitterCannotRecall();
    });

  });


  describe("After vesting time is passed", async function(){
    it("The beneficiary can finally spend", async function () {
      let time = vestingEndTime + 1;
      await network.provider.send("evm_setNextBlockTimestamp", [time]);
      await network.provider.send("evm_mine") // this one will have 2021-07-01 12:00 AM as its timestamp, no matter what the previous block has
      console.log("\tblocktime:"+(await hre.ethers.provider.getBlock("latest")).timestamp);
      await aliceCanSpend();
  
    });

    it("The emitter cannot recall tokens to him", async function () {
      await emitterCannotRecall();
    });

    it("The emitter can anytime unlock to beneficiary", async function () {
      await emitterEarlyUnlock();
    });  

    it("Nobody else can spend", async function () {
      await strangerNoSpend();
    });


   
   

  });
  

  





  

  
});
