const { expect } = require("chai");  
const { ethers } = require("hardhat");  

describe("Integration Test", function () {  
    let AdToken, adToken, Marketplace, marketplace, owner, addr1, addr2;

    before(async () => {  
        try {
            [owner, addr1, addr2] = await ethers.getSigners();  

            AdToken = await ethers.getContractFactory("AdToken");  
            adToken = await AdToken.deploy();  
            await adToken.waitForDeployment();  

            Marketplace = await ethers.getContractFactory("ArtMarketplaceDAppToken");  
            marketplace = await Marketplace.deploy(adToken.target);  
            await marketplace.waitForDeployment();
            
            await adToken.transfer(addr1.address, ethers.parseEther("100"));
            await adToken.transfer(addr2.address, ethers.parseEther("20"));

            await adToken.connect(addr2).approve(marketplace.target, ethers.parseEther("10"));
        } catch (error) {
            console.error("Error here: ", error);
        }
    });

    it("should allow user to buy artwork if requirements met", async () => {        
        await marketplace.connect(addr1).listArtwork(
            "Art1", 
            "A beautiful piece", 
            "image1.jpg", 
            "abstract",
            ethers.parseEther("10")
        );

        const artwork = await marketplace.artworks(1);
        expect(artwork.price).to.equal(ethers.parseEther("10"));
        
        await marketplace.connect(addr2).buyArtwork(1);

        const updatedArtwork = await marketplace.artworks(1);
        expect(updatedArtwork.owner).to.equal(addr2.address);
        expect(updatedArtwork.sold).to.be.true;

        const addr1Balance = await adToken.balanceOf(addr1.address);
        const addr2Balance = await adToken.balanceOf(addr2.address);

        expect(addr1Balance).to.equals(ethers.parseEther("110"));
        expect(addr2Balance).to.equals(ethers.parseEther("10"));
    });

    it("should prevent a user from buying artwork without sufficient funds or approval", async () => {
        await expect(marketplace.connect(addr2).buyArtwork(1))
            .to.be.revertedWith("Allowance too low");
    });
});