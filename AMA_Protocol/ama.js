// Ask Me Anything (AMA) protocol
// onchain questions submission
// author: @ArweaveNews

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

      document.getElementById('file').innerHTML = publicKey

    }



    }
};


async function checkAma() {

  const ama_id = document.getElementById('ama_id').value;
  
  const amas = {
    op: 'and',
    expr1: {
      op: 'equals',
      expr1: 'from',
      expr2: 'gLiSx5agTs1qgDfsUNelHQXno8qHl8G_48FNcmB3KJs'
      
      },

      expr2: {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'Content-Type',
          expr2: 'text/plain'
        },

        expr2: {
          op: 'and',
          expr1: {
            op: 'equals',
            expr1: 'ama_id',
            expr2: ama_id
          },

          expr2: {
            op: 'and',
            expr1: {
              op: 'equals',
              expr1: 'App-Name',
              expr2: 'ArweaveNews'
            },

            expr2: {
              op: 'equals',
              expr1: 'Protocol',
              expr2: 'AMA'
            }
          }
        }

      }

    };

    const response = await arweave.api.post('arql', amas);
    if (response["data"].length > 0) {
      if (privateKey) {
        postQ(ama_id)
      } else {
        alert("please login");
        return
      }

    } else {
      alert("uncorrect AMA ID");
      return
    }
  }

async function postQ(id) {
  const question = document.getElementById("question").value
  let tx = await arweave.createTransaction({data: question}, JSON.parse(privateKey));

  tx.addTag("App-Name", "ArweaveNews");
  tx.addTag("Protocol", "AMA");
  tx.addTag("ama_id", id );
  tx.addTag("Type", "post question");
  tx.addTag("q_from", publicKey)
  tx.addTag("Content-Type", "text/plain")

  await arweave.transactions.sign(tx, JSON.parse(privateKey));
  await arweave.transactions.post(tx)
  console.log(tx)
  console.log(tx.id)
  document.getElementById("q_id").innerHTML = `question id: ${tx.id}`

}


new Vue({
  el: "#app",

  data: {
    question: "",
    ama_id : ""
  }
  
})

