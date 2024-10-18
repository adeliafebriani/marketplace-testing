// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AdToken.sol";
// Change at the declare of IERC20

contract ArtMarketplaceDAppToken {
    IERC20 public adToken;

    struct Artwork {
        uint id;
        string name;
        string description;
        string imageUrl;
        string category;
        uint price; 
        address payable owner;
        bool sold;
    }

    struct Review {
        address reviewer;
        string comment;
    }

    mapping(uint => Artwork) public artworks;
    mapping(uint => Review[]) public artworkReviews;
    uint public artworkCount;

    event ArtworkListed(uint indexed id, string name, string description, string imageUrl, string category, uint price, address indexed owner);
    event ArtworkSold(uint indexed id, address indexed buyer);
    event ArtworkEdited(uint indexed id, string name, string description, string imageUrl, string category, uint price);
    event ArtworkDeleted(uint indexed id);
    event ReviewSubmitted(uint indexed artworkId, address indexed reviewer, string comment);

    modifier onlyOwner(uint _artworkId) {
        require(msg.sender == artworks[_artworkId].owner, "Not the owner");
        _;
    }

    constructor(address _adTokenAddress) {
        // adToken = IERC20(0xf2Ff00eB871E3435Dc653A896c83234e913e61F6);
        adToken = IERC20(_adTokenAddress);
    }

    function listArtwork(string memory _name, string memory _description, string memory _imageUrl, string memory _category, uint _price) public {
        artworkCount++;
        artworks[artworkCount] = Artwork(artworkCount, _name, _description, _imageUrl, _category, _price, payable(msg.sender), false);
        emit ArtworkListed(artworkCount, _name, _description, _imageUrl, _category, _price, msg.sender);
    }

    function editArtwork(uint _artworkId, string memory _imageUrl, string memory _name, string memory _description, string memory _category, uint _price) public onlyOwner(_artworkId) {
        Artwork storage artwork = artworks[_artworkId];
        artwork.imageUrl = _imageUrl;
        artwork.name = _name;
        artwork.description = _description;
        artwork.category = _category;
        artwork.price = _price;

        emit ArtworkEdited(_artworkId, _name, _description, _imageUrl, _category, _price);
    }

    function deleteArtwork(uint _artworkId) public onlyOwner(_artworkId) {
        Artwork storage artwork = artworks[_artworkId];
        delete artwork.name;
        delete artwork.description;
        delete artwork.imageUrl;
        delete artwork.category;
        artwork.price = 0;
        artwork.owner = payable(address(0));
        artwork.sold = false;

        delete artworks[_artworkId];

        emit ArtworkDeleted(_artworkId);
    }

    function buyArtwork(uint _id) public {
        Artwork storage artwork = artworks[_id];
        require(adToken.balanceOf(msg.sender) >= artwork.price, "Not enough AdToken");
        require(adToken.allowance(msg.sender, address(this)) >= artwork.price, "Allowance too low");
        require(artwork.owner != msg.sender, "Owner cannot buy their own artwork");

        require(adToken.transferFrom(msg.sender, artwork.owner, artwork.price), "AdToken transfer failed");

        artwork.owner = payable(msg.sender);
        artwork.sold = true;

        emit ArtworkSold(_id, msg.sender);
    }

    function submitReview(uint _artworkId, string memory _comment) public {
        artworkReviews[_artworkId].push(Review(msg.sender, _comment));
        emit ReviewSubmitted(_artworkId, msg.sender, _comment);
    }

    function getArtworkReviews(uint _artworkId) public view returns (Review[] memory) {
        return artworkReviews[_artworkId];
    }
}
