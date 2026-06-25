import { ethers } from "ethers";
import MissionNFTABI from "./MissionNFT.json";
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_MISSION_NFT_ADDRESS || "0xeB96BC56E6a395aE6232B0561BeD746F4eB2b1cE";
export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error("No hay wallet instalada");
  }
  const Web3Provider = ethers.providers?.Web3Provider || ethers.BrowserProvider;
  const provider = new Web3Provider(window.ethereum, "any");
  const signer = provider.getSigner ? provider.getSigner() : provider.getSigner();
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    MissionNFTABI,
    signer
  );
};
export const mintNFT = async (missionId, tokenURI) => {
  const contract = await getContract();
  const tx = await contract.completeMission(
    missionId,
    tokenURI
  );
  await tx.wait();
  return tx.hash;
};

/**
 * Consulta la Blockchain de SYS Chain (vía ethers) usando eventos
 * para recuperar todos los NFTs ERC-721 minteados por este Smart Contract
 * a favor del usuario.
 * @param {string} walletAddress La dirección de billetera del usuario.
 * @returns {Promise<Array>} Un array con metadatos y TX hash.
 */
export const fetchUserNFTs = async (walletAddress) => {
  if (!walletAddress) return [];
  try {
    const contract = await getContract();

    // 1. Obtener eventos Transfer hacia el usuario
    const filter = contract.filters.Transfer(null, walletAddress);
    const events = await contract.queryFilter(filter, 0, "latest");

    if (events.length === 0) return [];

    const nfts = [];

    // 2. Iterar en reverso (del más reciente al más viejo)
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      const tokenId = event.args.tokenId;

      // 3. Obtener el Token URI desde la cadena
      const tokenURI = await contract.tokenURI(tokenId);

      // 4. Intentar descargar y parsear el URI (Suele apuntar a IPFS u HTTP)
      let metadata = {};
      try {
        const uriToFetch = tokenURI.startsWith("ipfs://")
          ? tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
          : tokenURI;

        const resp = await fetch(uriToFetch);
        if (resp.ok) {
          metadata = await resp.json();
        }
      } catch (err) {
        console.warn(`Error al intentar traer metadata del token ${tokenId}:`, err);
      }

      // 5. Construir el objeto unificado (Misma estructura que local/MongoDB)
      nfts.push({
        id: tokenId.toString(),
        hash: event.transactionHash, // OnChain record verification!
        txHash: event.transactionHash,
        claimed: true,
        date: new Date().toLocaleDateString(), // Para fecha exacta tendríamos que consultar info de bloque, esto es aproximado
        lockedUntil: new Date(Date.now() + 86400000 * 30).toLocaleDateString(),
        owner: '...',
        ownerInitials: '..',
        isNew: false,
        title: metadata.name || `TPL NFT #${tokenId}`,
        description: metadata.description || 'NFT recuperado del blockchain',
        attributes: metadata.attributes || [],
        rarity: 'Common',
        acquisition: 'nft_acq_default',
      });
    }

    return nfts;
  } catch (err) {
    console.error("Error consultando NFTs On-Chain:", err);
    return [];
  }
};
