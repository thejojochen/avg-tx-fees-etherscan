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
  
  const dates = dateRange('2020-09-27', '2020-10-28');

  const startEpochArray = []
  const endEpochArray = []

  for (var i=0; i<dates.length; i++) {

    let startEpoch = dates[i].getTime()/1000.0
    startEpochArray.push(startEpoch);
    endEpochArray.push(startEpoch + (86400 - 1) ); //86400 seconds in a day

}

console.log(startEpochArray)
console.log(endEpochArray)



