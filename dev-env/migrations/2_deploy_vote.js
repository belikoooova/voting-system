const VoteContract = artifacts.require("VoteContract");

module.exports = async function (deployer) {
  await deployer.deploy(VoteContract);
  console.log("VoteContract deployed at:", VoteContract.address);
};
