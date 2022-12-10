const { Client, Intents } = require('discord.js');
const ethers = require('ethers');
require("dotenv").config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log(`Ready n' Logged in as ${client.user.tag}!`);
  client.user.setActivity({ name: `Watching for donations on ${DonationContractAddress}`, type: 'WATCHING' });
});

const abi = [
  {
    "inputs":[],
    "stateMutability":"nonpayable",
    "type":"constructor"
  },
  {
    "anonymous":false,
    "inputs":
    [
      {
        "indexed":false,
        "internalType":"address",
        "name":"from",
        "type":"address"
      },
      {
        "indexed":false,
        "internalType":"uint256",
        "name":"amount",
        "type":"uint256"
      }
    ],
      "name":"Donate",
      "type":"event"
  },
  {
    "inputs":[],
    "name":"newDonation",
    "outputs":[],
    "stateMutability":"payable",
    "type":"function"
  }
];

const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/', { name: 'binance', chainId: 56 });

const DonationContractAddress = '0xae611bea165249dee17613b067fc25532f422d76'
const DonationContract = new ethers.Contract(
  DonationContractAddress,
  abi,
  bscProvider
);

const topic = ethers.utils.id('Donate(address,uint256)');

const filter = {
  topics: [topic],
  fromBlock: 22688852
};

const getLogs = async (_result) => {
  try {
    const eventLog = DonationContract.interface.parseLog(
      _result
    )

    const from = eventLog.args.from
    const amount = eventLog.args.amount
    

    return {
      from,
      amount
    }
  } catch (e) {
    console.error(e)
  }
};

bscProvider.on(filter, async (result) => {
  const newDonationArgs = await getLogs(result)

  console.log(`New Donation Found! From`, newDonationArgs.from, `For`, newDonationArgs.amount , `BNB`)

  sendDiscordMsg(newDonationArgs.from, newDonationArgs.amount);
});


const sendDiscordMsg = async (_from, _amount) => {
  const channel = client.channels.cache.get('820375466271178765');
  if (!channel) {
    return;
  }

  bscProvider.resetEventsBlock(22688852);
  channel.send("newDonationArgs", async (req, res) => {
    const { body } = req;
    let from = body.txs[0].fromAddress;
    let amount = Number(body.txs[0].value / 1E18);
    const url = `https://bscscan.com/address/0xae611bea165249dee17613b067fc25532f422d76`
    const donationUrl = `https://bscscan.com/address/0xae611bea165249dee17613b067fc25532f422d76#writeContract`
    const donationAddress = `https://bscscan.com/address/0x64ecf1f9bd4edf6267f6f4de42ad0979f6127727#internaltx`
    
    channel.send(`
      New Donation submitted by \`${from}\`, for ${amount.toFixed(8)} BNB!! ${url} 
      \n\n Thank you \`${from}\`, for your donation!
      `);
    channel.send(`
      Would you like to help us expand & improve our services?
      \n If you answered yes, then you can donate any amount you would like using our donation contract
      \n ${donationUrl}
      `);
      channel.send(`
      \`Note about donations\`
      \n \`All donations received will be used to help us expand and improve our services\`
      \n\`Where we use the funds will be down to you guys!!\`
      You van view what address the donations are going ${donationAddress}
      `);
    return res.status(200).json();
  });  
};
