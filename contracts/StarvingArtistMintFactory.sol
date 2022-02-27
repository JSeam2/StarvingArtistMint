// SPDX-License-Identifier: AGPL-3.0

pragma solidity ^0.8.12;

import {Clones} from "./utils/Clones.sol";
import {StarvingArtistMint} from "./StarvingArtistMint.sol";

contract StarvingArtistMintFactory {
    event CreateStarvingArtistMint(StarvingArtistMint starvingArtistMint);

    address public immutable implementation;

    constructor(address implementation_) {
        implementation = implementation_;
    }

    // TODO: Check for an ecdsa signature to verify that variables are approved by owner
    function createStarvingArtistMint(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address owner,
        address firstBuyer
    ) external returns (StarvingArtistMint starvingArtistMint) {
        starvingArtistMint = StarvingArtistMint(Clones.clone(implementation));
        starvingArtistMint.initialize(name, symbol, baseURI, owner, firstBuyer);
        emit CreateStarvingArtistMint(starvingArtistMint);
    }
}