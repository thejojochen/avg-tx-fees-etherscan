// Uncomment the next line for use in NodeJS:
const XLSX = require("xlsx")

async function writeToExcel() {
  /* fetch JSON data and parse */
  // const url = "https://theunitedstates.io/congress-legislators/executive.json";
  // const raw_data = (await axios(url, {responseType: "json"})).data;
  
  // /* filter for the Presidents */
  // const prez = raw_data.filter(row => row.terms.some(term => term.type === "prez"));

  // /* flatten objects */
  // const rows = prez.map(row => ({
  //   name: row.name.first + " " + row.name.last,
  //   birthday: row.bio.birthday
  // }));

  function dataObject(name, age, sex) {
    this.name = name;
    this.age = age;
    this.sex = sex;
  }

  const alice = new dataObject('eth mainnet', '2/2', '5')
  const bob = new dataObject('eth mainnet', '2/2', '7')
  console.log(alice.name)
  console.log(bob.sex)

  let arr = []
  arr.push(alice)
  arr.push(bob)
  console.log(arr)

  /* generate worksheet and workbook */
  const worksheet = XLSX.utils.json_to_sheet(arr);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "GasFeesEth");

  /* fix headers */
  XLSX.utils.sheet_add_aoa(worksheet, [["FeeEth", "Birthday"]], { origin: "A1" });

  /* calculate column width */
  //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
  //worksheet["!cols"] = [ { wch: max_width } ];

  /* create an XLSX file and try to save to Presidents.xlsx */
  XLSX.writeFile(workbook, "averageGasFeeData.xlsx");

}

writeToExcel()