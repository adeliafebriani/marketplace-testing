const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit Test", function () {
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

    describe("Initial Supply", function () {
        it("should deploy AdToken with initial supply", async () => {
            const balance = await adToken.balanceOf(owner.address);
            expect(balance).to.equal(ethers.parseEther("99880"));
        });
    });

    describe("List Artwork", function () {
        it("should allow users to list artwork", async () => {
            await marketplace.connect(addr1).listArtwork(
                "Art1", 
                "A beautiful piece", 
                "image1.jpg", 
                "abstract", 
                ethers.parseEther("10")
            );
    
            const artwork = await marketplace.artworks(1);
            expect(artwork.name).to.equal("Art1");
            expect(artwork.price).to.equal(ethers.parseEther("10"));
            expect(artwork.owner).to.equal(addr1.address);
            expect(artwork.sold).to.be.false;
        });
    });
    
    describe("Edit Artwork", function () {
        it("should allow owner to edit artwork", async function () {
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
                "Art1", 
                "A beautiful piece",
                "painting", // change
                ethers.parseEther("10")
            )).to.emit(marketplace, "ArtworkEdited");

            const artwork = await marketplace.artworks(1);
            expect(artwork.category).to.equal("painting");
        });        
    });        
    
    describe("Delete Artwork", function () {
        it("should allow owner to delete artwork", async function () {
            await marketplace.connect(addr1).listArtwork(
                "Art1", 
                "A beautiful piece", 
                "image1.jpg", 
                "abstract", 
                ethers.parseEther("10")
            );
            
            await expect(marketplace.connect(addr1).deleteArtwork(1))
                .to.emit(marketplace, "ArtworkDeleted");

            const artwork = await marketplace.artworks(1);
            expect(artwork.name).to.equal("");
            expect(artwork.description).to.equal("");
            expect(artwork.imageUrl).to.equal("");
            expect(artwork.category).to.equal("");
            expect(artwork.price).to.equal(0);
        });
    });

    describe("Buy Artwork", function () {
        it("should allow user to buy artwork using AdToken", async () => {
            await marketplace.connect(addr1).listArtwork(
                "Art1", 
                "A beautiful piece", 
                "image1.jpg", 
                "abstract",
                ethers.parseEther("10")
            );

            const artwork = await marketplace.artworks(1);
            expect(artwork.name).to.equal("Art1");
            expect(artwork.price).to.equal(ethers.parseEther("10"));
            expect(artwork.owner).to.equal(addr1.address);
            expect(artwork.sold).to.be.false;

            await marketplace.connect(addr2).buyArtwork(1);

            const updatedArtwork = await marketplace.artworks(1);
            expect(updatedArtwork.owner).to.equal(addr2.address);
            expect(updatedArtwork.sold).to.be.true;
        });
    });

    describe("Review Artwork", function () {
        it("should allow user to submit a review for artwork", async function () {
            await marketplace.connect(addr1).listArtwork(
                "Art1", 
                "A beautiful piece", 
                "image1.jpg", 
                "abstract", 
                ethers.parseEther("10")
            );
        
            await expect(marketplace.connect(addr2).submitReview(1, "Great artwork"))
                .to.emit(marketplace, "ReviewSubmitted");
        
            const reviews = await marketplace.getArtworkReviews(1);
            expect(reviews[0].comment).to.equal("Great artwork");
            expect(reviews[0].reviewer).to.equal(addr2.address);
        });
    });
});
