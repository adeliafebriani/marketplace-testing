const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("End-to-End Test", function () {
    let AdToken, adToken, Marketplace, marketplace, owner, addr1, addr2;

    beforeEach(async function () {
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
    });
    
    it("should allow editing and deleting of artwork by owner", async function () {
        await marketplace.connect(addr1).listArtwork(
            "Art1", 
            "A beautiful piece", 
            "image1.jpg", 
            "abstract", 
            ethers.parseEther("10")
        );
        
        await expect(marketplace.connect(addr1).editArtwork(
            1, 
            "image1.jpg", 
            "Updated Art", 
            "Updated description", 
            "modern", 
            ethers.parseEther("5")
        )).to.emit(marketplace, "ArtworkEdited");

        const artwork = await marketplace.artworks(1);
        expect(artwork.name).to.equal("Updated Art");
        expect(artwork.description).to.equal("Updated description");
        expect(artwork.category).to.equal("modern");
        expect(artwork.price).to.equal(ethers.parseEther("5"));

        await marketplace.connect(addr1).deleteArtwork(1);
        const deletedArtwork = await marketplace.artworks(1);
        expect(deletedArtwork.name).to.equal("");
    });

    it("should allow submission and retrieval of reviews", async () => {
        await marketplace.connect(addr1).submitReview(2, "Amazing artwork!");
        const reviews = await marketplace.getArtworkReviews(2);
        expect(reviews[0].comment).to.equal("Amazing artwork!");
        expect(reviews[0].reviewer).to.equal(addr1.address);
    });
});