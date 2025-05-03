// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VoteContract {
    struct Vote {
        string voteId;
        string userId;
        string encryptedVote;
        string zkProof;
        uint256 timestamp;
    }

    mapping(string => Vote) private votesByToken;
    mapping(string => string[]) private tokensByVoteId;

    event VoteSaved(string indexed voteToken, string voteId, string userId);

    /// @notice Сохраняет голос и возвращает уникальный voteToken
    function saveVote(
        string calldata voteId,
        string calldata userId,
        string calldata encryptedVote,
        string calldata zkProof
    ) external returns (string memory voteToken) {
        uint256 ts = block.timestamp;
        voteToken = _computeToken(voteId, userId, ts);
        votesByToken[voteToken] = Vote(voteId, userId, encryptedVote, zkProof, ts);
        tokensByVoteId[voteId].push(voteToken);
        emit VoteSaved(voteToken, voteId, userId);
        return voteToken;
    }

    /// @notice Отдает данные голоса по токену
    function getBlock(string calldata voteToken)
    external view returns (
        string memory voteId,
        string memory userId,
        string memory encryptedVote,
        string memory zkProof,
        uint256 timestamp
    )
    {
        Vote storage v = votesByToken[voteToken];
        require(bytes(v.voteId).length != 0, "Not found");
        return (v.voteId, v.userId, v.encryptedVote, v.zkProof, v.timestamp);
    }

    /// @notice Список всех токенов (голосов) для данного голосования
    function getAllBlocks(string calldata voteId)
    external view returns (string[] memory)
    {
        return tokensByVoteId[voteId];
    }

    function _computeToken(
        string memory voteId,
        string memory userId,
        uint256 timestamp
    ) internal pure returns (string memory) {
        bytes32 h = keccak256(abi.encodePacked(voteId, userId, timestamp));
        return _toHexString(h);
    }

    // Вспомогательная функция конвертации bytes32 в string hex
    function _toHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(2 + 64);
        str[0] = "0"; str[1] = "x";
        for (uint i = 0; i < 32; i++) {
            str[2 + i*2]     = hexChars[ uint8(data[i] >> 4) ];
            str[2 + i*2 + 1] = hexChars[ uint8(data[i] & 0x0f) ];
        }
        return string(str);
    }
}
