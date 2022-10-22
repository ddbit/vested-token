const { expect } = require("chai");
const { ethers } = require("hardhat");

//now() -> secs since epoc
const now = _=> Math.floor(Date.now() / 1000);
const AMOUNT = 25;

describe("ERC20 proxy functions to timelocked positions", function(){

    before(async function () {
        [this.alice, this.bob, this.charlie] = await ethers.getSigners();
        this.Token = await ethers.getContractFactory("TestToken");
        this.token = await this.Token.deploy(1000);
        await this.token.deployed();
        console.log("token",this.token.address);

        expect(await this.token.balanceOf(this.alice.address)).equal(1000);
      
        this.Factory = await ethers.getContractFactory("TimelockFactory");
        this.factory = await this.Factory.deploy(this.token.address);
        let rcpt = await this.factory.deployed();
      
        this.Proxy = await ethers.getContractFactory("TokenProxy");
        this.proxy = await this.Proxy.deploy(this.factory.address);
        await this.proxy.deployed();
        console.log("proxy",this.proxy.address);
    });    
    it("check totalSupply() ", async function () {

        //create positions 1 x alice, 2 x bob, 1 x charlie
        //fund each with AMOUNT
        let 
        tx = await this.factory.createNew(this.alice.address, now()+7200);
        let res = await tx.wait();
        let position = res.events[0].args[0];
        console.log('position',position);
        await (await this.token.transfer(position,AMOUNT)).wait();


        tx = await this.factory.createNew(this.bob.address, now()+7200);
        res = await tx.wait();
        position = res.events[0].args[0];
        console.log('position',position);
        await (await this.token.transfer(position,AMOUNT)).wait();


        tx = await this.factory.createNew(this.bob.address, now()+7200);
        res = await tx.wait();
        position = res.events[0].args[0];
        console.log('position',position);
        await (await this.token.transfer(position,AMOUNT)).wait();


        tx = await this.factory.createNew(this.charlie.address, now()+7200);
        res = await tx.wait();
        position = res.events[0].args[0];
        console.log('position',position);
        await (await this.token.transfer(position,AMOUNT)).wait();


        let totalSupply = await this.proxy.totalSupply();
        console.log(totalSupply);
        expect(totalSupply).equal(AMOUNT * 4);
        //expect(await greeter.greet()).to.equal("Hola, mundo!");
    });

    it("check balanceOf()", async function () {
        let 
        balance = await this.proxy.balanceOf(this.alice.address);
        expect(balance).equal(AMOUNT);

        balance = await this.proxy.balanceOf(this.bob.address);
        expect(balance).equal(AMOUNT * 2);

        balance = await this.proxy.balanceOf(this.charlie.address);
        expect(balance).equal(AMOUNT);
    });
  
});