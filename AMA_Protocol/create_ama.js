let privateKey;
let publicKey;



const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https"
});


function getJwk(fileInput) {
  let file = fileInput.files[0];

  let reader = new FileReader();

  reader.readAsText(file);

  reader.onload = async function() {

    privateKey = reader.result;
    publicKey = await arweave.wallets.jwkToAddress(JSON.parse(privateKey))

    if (publicKey) {

      document.getElementById('file').innerHTML = `Logged as: ${publicKey}`

    }



    }
};




async function create() {
  const ama_id = document.getElementById("ama_id").value
  let compatible_id = `@${ama_id}_${Date.now()}_AMA`
  let tx = await arweave.createTransaction({data: ama_id}, JSON.parse(privateKey));

  tx.addTag("App-Name", "ArweaveNews");
  tx.addTag("Protocol", "AMA");
  tx.addTag("ama_id", compatible_id );
  tx.addTag("Content-Type", "text/plain");

  await arweave.transactions.sign(tx, JSON.parse(privateKey));
  await arweave.transactions.post(tx)

  document.getElementById("ama_txid").innerHTML = `AMA TXID: ${tx.id}`

}

