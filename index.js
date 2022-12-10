const { Client, Intents } = require('discord.js');
const ethers = require('ethers');
require("dotenv").config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log(`Ready n' Logged in as ${client.user.tag}!`);
  // Set the bot's activity
  client.user.setActivity({
    name: `Watching for donations on ${DonationContractAddress}`,
    type: 'WATCHING'
  });
});

const abi = [
  {
    "inputs":[],
    "stateMutability":"nonpayable",
    "type":"constructor"
  },
  {
    "anonymous":false,
    "inputs": [
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
  // Get the channel by its ID
  const channel = client.channels.cache.get('820375466271178765');
  if (!channel) {
    return;
  }

  // Reset the block for events
  bscProvider.resetEventsBlock(22688852);
  
  // Send a message to the channel
  await channel.send(`New donation received from ${_from} for ${_amount} BNB!`);
  
  // Return a successful response
  return res.status(200).json();
};