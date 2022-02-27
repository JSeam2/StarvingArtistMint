//SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import {ERC721} from "./utils/ERC721.sol";
import {Ownable} from "./utils/Ownable.sol";
import {Strings} from "./utils/Strings.sol";

// Sample contract where artist has control over mints
contract StarvingArtistMint is ERC721("", ""), Ownable(address(0)) {
    using Strings for uint256;

    uint256 public tokenCount;
    string public baseURI;

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address owner_,
        address firstBuyer_
    ) external {
        name = name_; 
        symbol = symbol_;
        baseURI = baseURI_;

        _mint(firstBuyer_, 0);
        tokenCount++;

        owner = owner_;
    }

    /// @dev returns token uri and concatenates id
    function tokenURI(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, id.toString()));
    }
    
    /// @dev allow owner to set token uri
    function setTokenURI(string memory tokenURI_) public onlyOwner {
        baseURI = tokenURI_;
    }

    /// @dev allow owner to mint to an address, to use other contracts to sale mech
    function mint(address to) public onlyOwner {
        _mint(to, tokenCount);
        tokenCount++;
    }

    /// TODO: Lazy Minting where artist signs a message and buyer mints
    // function lazyMint()
}
