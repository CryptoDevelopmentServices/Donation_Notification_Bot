const { Client } = require('discord.js');
const ethers = require('ethers');
require("dotenv").config();
const abi = require('./abi.json');

// Define the DonationContractAddress variable before using it
const DonationContractAddress = process.env.DONATION_ADDRESS;

// Create a new Discord client
const client = new Client({
  ws: {
    intents: ['GUILDS', 'GUILD_MESSAGES']
  }
});

// Log the client in using the token from the environment variables
client.login(process.env.TOKEN);

// Set the client's activity when it is ready
client.on('ready', () => {
  console.log(`Ready n' Logged in as ${client.user.tag}!`);

  // Set the activity
  client.user.setActivity({ name: `Watching for donations on ${DonationContractAddress}`, type: 'WATCHING' });
});

// Create a new JSON-RPC provider for Binance Smart Chain
const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/', { name: 'binance', chainId: 56 });

const DonationContract = new ethers.Contract(
  DonationContractAddress,
  abi,
  bscProvider
);

// Specify the topic of the event you want to listen to
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

// Listen for events using the filter
bscProvider.on(filter, async (result) => {
  console.log('New event received!');

  const newDonationArgs = await getLogs(result)

  console.log(`New Donation Found! From`, newDonationArgs.from, `For`, newDonationArgs.amount , `BNB`)

  // Call the sendDiscordMsg function and pass it the from and amount values
  sendDiscordMsg(newDonationArgs.from, newDonationArgs.amount);
});

const sendDiscordMsg = async (_from, _amount) => {
  // Get the channel by its ID
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  console.log(channel);
  if (!channel) {
    return;
  }
  
  // Send a message to the channel
  try {
    await channel.send(`New donation received from ${_from} for ${_amount} BNB!`);
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
};