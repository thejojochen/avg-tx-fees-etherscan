const { concat } = require('@ethersproject/bytes');
const axios = require('axios')
const { ethers } = require("ethers");
const XLSX = require("xlsx")
const dotenv = require('dotenv')

require('dotenv').config()
ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

async function constructRequest(
    contractAddress,
    address,
    startblock,
    endblock,
    
    apikey
) {

//https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-erc20-token-transfer-events-by-address

//hardcoded parameters
// const contractAddress = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
// const startblock = '1'
// const endblock = '2'
// const apikey = 'exampleapikey'

const request = 'https://api.etherscan.io/api'+

   '?module=account'+
   '&action=tokentx'+
   `&contractaddress=${contractAddress}`+
   `&address=${address}`+
   '&page=1'+
   '&offset=100'+
   `&startblock=${startblock}`+
   `&endblock=${endblock}`+
   '&sort=asc'+
   `&apikey=${apikey}`

  return request
}

async function doRequest(requesturl) {
    
    let data
    try {
        data = await axios.get(requesturl)
      } catch (error) {
        console.error(error);
      }
    
    return data.data
}

async function extractFromData(dataobject) {

    let sumOfEther = 0
    for (var i=0; i<dataobject.result.length; i++) {
        
        //console.log(dataobject.result[i].gasUsed)
        //console.log(dataobject.result[i].gasPrice)

        //console.log(ethers.utils.formatUnits(dataobject.result[i].gasUsed,18))
        //console.log(ethers.utils.formatUnits(dataobject.result[i].gasPrice,18))

        sumOfEther += Number(dataobject.result[i].gasUsed) * Number(dataobject.result[i].gasPrice)
        
        
    }

    //console.log(`total ether used in block range: ${sumOfEther}`)
    let averageEthPerTransaction = sumOfEther / dataobject.result.length
    averageEthPerTransaction = Math.round(averageEthPerTransaction)

    let stringEther = averageEthPerTransaction.toString()

    if (stringEther == 'NaN') return ('NaN')
    let formattedEther = ethers.utils.formatUnits(stringEther,18)
    return(formattedEther)
}

async function convertEpochToBlockNumber(startEpoch, endEpoch) {

//    //convert human date to epoch value
//    let concatenatedStartDate = startMonth + " " + startDay + ", " + startYear + " 16:00:00"
//    //console.log(concatenatedStartDate)
//    let startDate = new Date(concatenatedStartDate); // Your timezone!
//    // imporvement idea: auto convert pst timezone to utc timezone 
//    let startEpoch = startDate.getTime()/1000.0;

//    let concatenatedEndDate = endMonth + " " + endDay + ", " + endYear + " 15:59:59"
//    let endDate = new Date(concatenatedEndDate); // Your timezone!
//    let endEpoch = endDate.getTime()/1000.0;

   const startBlockNumberRequest = 'https://api.etherscan.io/api'+
   '?module=block'+
   '&action=getblocknobytime'+
   `&timestamp=${startEpoch}`+
   '&closest=after'+
   `&apikey=${ETHERSCAN_API_KEY}`

   let startBlockRequestData = await doRequest(startBlockNumberRequest)
   const startBlockNumber = startBlockRequestData.result

   const endBlockNumberRequest = 'https://api.etherscan.io/api'+
    '?module=block'+
    '&action=getblocknobytime'+
    `&timestamp=${endEpoch}`+
    '&closest=after'+
    `&apikey=${ETHERSCAN_API_KEY}`

    let endBlockRequestData = await doRequest(endBlockNumberRequest)
    const endBlockNumber = endBlockRequestData.result

    return [startBlockNumber, endBlockNumber]
}

function dateRange(startDate, endDate, steps = 1) {
    const dateArray = [];
    let currentDate = new Date(startDate);
  
    while (currentDate <= new Date(endDate)) {
      dateArray.push(new Date(currentDate));
      // Use UTC date to prevent problems with time zones and DST
      currentDate.setUTCDate(currentDate.getUTCDate() + steps);
    }
  
    return dateArray;
  }


async function getHistoricalEthPrice() {

   const historicalEthPriceRequest = 
   'https://api.etherscan.io/api'+
   '?module=stats'+
   '&action=ethdailyprice'+
   '&startdate=2022-12-10'+
   '&enddate=2022-12-11'+
   '&sort=asc'+
   '&apikey=YourApiKeyToken'

   console.log(await doRequest(historicalEthPriceRequest))
}

async function main() {

    console.log('fetching and extracting data...')

    const dates = dateRange('2021-05-02', '2021-05-05');

    const startEpochArray = []
    const endEpochArray = []
    //const totalEtherArray = []
    let resultArr = []
  
    for (var i=0; i<dates.length; i++) {
  
      let startEpoch = dates[i].getTime()/1000.0
      startEpochArray.push(startEpoch);
      endEpochArray.push(startEpoch + (86400 - 1) ); //86400 seconds in a day
  
    }

    for (var i=0; i<dates.length; i++) {
        
      
    let startingEpoch = startEpochArray[i]
    let endingEpoch = endEpochArray[i]

    startEndArr = await convertEpochToBlockNumber(startingEpoch, endingEpoch)
    //console.log (`start block: ${startEndArr[0]}, end block: ${startEndArr[1]}`)
    let startBlock = startEndArr[0]
    let endBlock = startEndArr[1]
    console.log(startBlock)
    console.log(endBlock)

    const request = await constructRequest(
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',  //USDC (every transaction in the pool involves a usdc/weth pair)
      '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',  // Uniswap pool address (Uniswap V3: USDC 3) https://info.uniswap.org/pools#/pools/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
      startBlock,                                    //start block
      endBlock,                                      //end block
      ETHERSCAN_API_KEY                              //api key (kept in env file)
    )

    //uncomment to debug url
    //console.log(request)

    //uncomment to make fresh request
    const data = await doRequest(request)
    //console.log(data)
    //var jsonObj = JSON.parse(data)
    // var jsonContent = JSON.stringify(data)
    // fs.writeFile('/home/jonasc/econ-defi/queriedData.json', jsonContent, err => {
    //     if (err) {
    //       console.error(err);
    //     }
    // })

    // const testData = {
    //     status: '1',
    //     message: 'OK',
    //     result: [
    //       {
    //         blockNumber: '16185805',
    //         timeStamp: '1671055511',
    //         hash: '0xcc22c30d17af0d129e489006c6d3446d754c26c27f91529b909a94d5ac0c68fc',
    //         nonce: '0',
    //         blockHash: '0xa2a4556729c95ef184ee33fffbf6a4b6b309d01912208c90702d39d42c0fdc6e',
    //         from: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    //         to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    //         contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    //         value: '12982539996',
    //         tokenName: 'USD Coin',
    //         tokenSymbol: 'USDC',
    //         tokenDecimal: '6',
    //         transactionIndex: '117',
    //         gas: '360388',
    //         gasPrice: '16189230610',
    //         gasUsed: '266355',
    //         cumulativeGasUsed: '12372739',
    //         input: 'deprecated',
    //         confirmations: '153'
    //       },
    //       {
    //         blockNumber: '16185805',
    //         timeStamp: '1671055511',
    //         hash: '0xeea2de82776f8e03e09ebee4dc0118c12a89f15f1aee6ee223c2ddd1736ce621',
    //         nonce: '15',
    //         blockHash: '0xa2a4556729c95ef184ee33fffbf6a4b6b309d01912208c90702d39d42c0fdc6e',
    //         from: '0xf26696a9177c964ed86def5454e7ddd00a44486e',
    //         to: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    //         contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    //         value: '50000000000',
    //         tokenName: 'USD Coin',
    //         tokenSymbol: 'USDC',
    //         tokenDecimal: '6',
    //         transactionIndex: '257',
    //         gas: '254713',
    //         gasPrice: '14652831182',
    //         gasUsed: '190070',
    //         cumulativeGasUsed: '24798313',
    //         input: 'deprecated',
    //         confirmations: '153'
    //       }
    //     ]
    //   }

    // total amount of ether used 
    
    const averageEther = await extractFromData(data)
    // console.log (dates[i] + ' => average gas requirement in units of ether: ' + averageEther)

    class uniswapFees {
        constructor(network, timestamp, avgfee) {
          this.network = network;
          this.timestamp = timestamp;
          this.avgfee = avgfee;
        }
      }
    resultArr.push(new uniswapFees('ETH Mainnet', dates[i], averageEther))

    console.log(dates[i])

    //totalEtherArray.push(totalEther)
    


    }
    //console.log(totalEtherArray)
    console.log(resultArr)

    //un comment to write to excel file
    // console.log('writing to excel file...')
    // const worksheet = XLSX.utils.json_to_sheet(resultArr);
    // const workbook = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(workbook, worksheet, "GasFeesEth");
  
    // /* fix headers */
    // XLSX.utils.sheet_add_aoa(worksheet, [["network", "timestamp","avgfee"]], { origin: "A1" });
  
    // /* create an XLSX file and try to save to Presidents.xlsx */
    // XLSX.writeFile(workbook, "averageGasFeeData.xlsx");
    // console.log('completed')
    // console.log('problem: mev bots willing to pay dispropotionately high gas fees')


  }

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function test() {

    await getHistoricalEthPrice()
}

// test().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
//   });

