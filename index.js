const discord = require('discord.js')
const ethers = require('ethers')
const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const winston = require('winston')




const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

app.use(express.json());

// TODO: Switch on chainId
//       support version #? have the reference frontend support version #s?
//       possibly contract addresses to watch

const client = new discord.Client({
  intents: [],
});

client.login(process.env.TOKEN)

client.on('ready', () => {
  console.log(`Ready n' Logged in as ${client.user.tag}!`)
})



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
]




let bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/', { name: 'binance', chainId: 56 })

const DonationContractAddress = '0xae611bea165249dee17613b067fc25532f422d76'
const DonationContract = new ethers.Contract(
  DonationContractAddress,
  abi,
  bscProvider
)

let topic = ethers.utils.id('Donate(address,uint256)')


let filter = {
  topics: [topic],
  fromBlock: 22688852
}


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
    logger.error(e)
  }
}

bscProvider.on(filter, async (result) => {
  const newDonationArgs = await getLogs(result)

  console.log(`New Donation Found! From`, newDonationArgs.from, `For`, newDonationArgs.amount , `BNB`)
  logger.info(`found result! From`, newDonationArgs.from, `For`, newDonationArgs.amount, `BNB`)
  
  sendDiscordMsg(newDonationArgs)
})

bscProvider.resetEventsBlock(22688852)

const sendDiscordMsg = async ({from , amount}) => {
  app.post("newDonationArgs", async (req, res) => {
  const { body } = req;
  let from = body.txs[0].fromAddress;
  let amount = Number(body.txs[0].value / 1E18);
  const url = `https://bscscan.com/address/${DonationContractAddress}#tokentxns`

  
  const channel = await client.channels.fetch('820375466271178765')
  channel.send(`New Donation submitted by \`${from}\`, for ${amount.toFixed(4)} BNB!! ${url}`)
  channel.send(`Thank you \`${from}\`, for your donation`);
  return res.status(200).json();

  
})
  console.log(`sent msg with url ${url}`)
}

app.listen(port, () => {
  console.log(`Listening for new donations`);
});
