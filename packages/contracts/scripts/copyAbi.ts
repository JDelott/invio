import fs from 'fs-extra';
import path from 'path';

async function main() {
  // Path to the compiled contract artifacts
  const contractsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
  
  // Destination directory in the web app
  const destDir = path.join(__dirname, '..', '..', '..', 'apps', 'web', 'src', 'constants');
  
  // Ensure the destination directory exists
  await fs.ensureDir(destDir);
  
  // Create ABIs file
  const abiFile = path.join(destDir, 'contractABIs.ts');
  
  // Extract ABIs
  const invoiceContractArtifact = require(path.join(contractsDir, 'InvoiceContract.sol', 'InvoiceContract.json'));
  const mockUSDCArtifact = require(path.join(contractsDir, 'MockUSDC.sol', 'MockUSDC.json'));
  
  // Create the TypeScript file with the ABIs
  const content = `// Auto-generated - do not edit
export const InvoiceContractABI = ${JSON.stringify(invoiceContractArtifact.abi, null, 2)};

export const MockUSDCABI = ${JSON.stringify(mockUSDCArtifact.abi, null, 2)};

// These addresses will be populated after deployment
export const INVOICE_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
export const MOCK_USDC_ADDRESS = '0x0000000000000000000000000000000000000000';
`;

  await fs.writeFile(abiFile, content);
  console.log(`Contract ABIs written to ${abiFile}`);
}

main().catch(console.error);
