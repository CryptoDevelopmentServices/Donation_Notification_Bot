const { Client, Intents } = require('discord.js');
const ethers = require('ethers');
require("dotenv").config();

// Create a new Discord client
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Log the client in using the token from the environment variables
client.login(process.env.TOKEN);

// Set the client's activity when it is ready
client.on('ready', () => {
  console.log(`Ready n' Logged in as ${client.user.tag}!`);

  // Define the DonationContractAddress variable before using it
  const DonationContractAddress = '0xae611bea165249dee17613b067fc25532f422d76';
  client.user.setActivity({ name: `Watching for donations on ${DonationContractAddress}`, type: 'WATCHING' });
});

// Define the ABI of the contract
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

// Create a new JSON-RPC provider for Binance Smart Chain
const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/', { name: 'binance', chainId: 56 });

const DonationContract = new ethers.Contract(
  DonationContractAddress,
  abi,
  bscProvider
);

// Specify the toping of the event you want to listen too
const topic = ethers.utils.id('Donate(address,uint256)');

const filter = {
  topics: [topic],
  fromBlock: 22688852
};

const getLogs = async (_result) => {
  try {
    // Return the full parsed log object, rather than just the from and amount values
    return DonationContract.interface.parseLog(_result);
  } catch (e) {
    console.error(e)
  }
};

bscProvider.on(filter, async (result) => {
  const newDonationArgs = await getLogs(result)

  console.log(`New Donation Found! From`, newDonationArgs.from, `For`, newDonationArgs.amount , `BNB`)

  // Call the sendDiscordMsg function and pass it the from and amount values
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
  try {
    await channel.send(`New donation received from ${_from} for ${_amount} BNB!`);
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
};

const success = sendDiscordMsg(_from, _amount);

if (success) {
  return res.status(200).json();
} else {
  return res.status(500).json();
};