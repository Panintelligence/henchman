module.exports.intersectArray = (a, b) => {
  return a.filter((e) => { b.includes(e) });
};

const dateUtils = {
  max: (date1, date2)=>{
    return new Date(Math.max(new Date(date1), new Date(date2)));
  },
  min: (date1, date2)=>{
    return new Date(Math.min(new Date(date1), new Date(date2)));
  },
  formatDate: (date) => {
    return `${new Date(date).getFullYear()}-${new Date(date).getMonth() + 1}-${new Date(date).getDate()}`;
  },
  formatHumanISO: (date)=>{
    return new Date(date).toISOString().split('T').join(' ').split('.')[0];
  },
  isSameDay: (date1, date2) => {
    return dateUtils.formatDate(new Date(date1)) === dateUtils.formatDate(new Date(date2));
  },
  addDays: (date, days) => {
    const newDate = new Date(new Date(date).valueOf());
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  },
  getWeekStart: (date) => {
    return dateUtils.addDays(date, new Date(date).getDay() * -1);
  },
  getWeekEnd: (date) => {
    return dateUtils.addDays(dateUtils.getWeekStart(date), 7);
  },
  getWeekRange: (date) => {
    return {
      start: dateUtils.getWeekStart(date),
      end: dateUtils.getWeekEnd(date),
    };
  }
}

const stringUtils = {
  capitalize: (string) => {
    const words = string.split(" ");
    return words.map((w) => { return w.charAt(0).toUpperCase() }).join(" ");
  },
  startsWithAny: (string, startingList) => {
    for (let i in startingList) {
      if (string.indexOf(startingList[i]) === 0) {
        return startingList[i];
      }
    }
    return null;
  }
};

module.exports.string = stringUtils;
module.exports.date = dateUtils;