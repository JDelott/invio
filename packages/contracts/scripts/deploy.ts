import hre from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Deploy MockUSDC first
  const MockUSDC = await hre.viem.deployContract("MockUSDC");
  console.log(`MockUSDC deployed to: ${MockUSDC.address}`);

  // Deploy InvoiceContract with MockUSDC address
  const InvoiceContract = await hre.viem.deployContract("InvoiceContract", [
    MockUSDC.address,
  ]);
  console.log(`InvoiceContract deployed to: ${InvoiceContract.address}`);

  console.log("Deployment complete!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
