const arrayUtils = {
  intersectWithDuplicates: (a, b) => {
    return a && b ? a.filter((e) => {
      return b.includes(e)
    }) : [];
  },
  intersect: (a, b) => {
    return arrayUtils.intersectWithDuplicates(a, b)
      .reduce((arr, e) => {
        !arr.includes(e) && arr.push(e);
        return arr;
      }, []);
  },
  anyIntersection: (a, b) => {
    return arrayUtils.intersect(a, b).length > 0;
  }
};

const dateUtils = {
  midnightToday: () => {
    const midnightTodayDate = new Date();
    midnightTodayDate.setHours(0);
    midnightTodayDate.setMinutes(0);
    midnightTodayDate.setSeconds(0);
    midnightTodayDate.setMilliseconds(0);
    return midnightTodayDate;
  },
  textToDateRange: (date, text) => {
    if (text === "tomorrow") {
      return {
        start: dateUtils.addDays(date, 1),
        end: dateUtils.addDays(date, 2)
      }
    } else {
      if (text === "this week") {
        return dateUtils.getWeekRange(date);
      } else if (text === "next week") {
        return dateUtils.getWeekRange(dateUtils.addDays(date, 8));
      }
    }

    return null;
  },
  max: (date1, date2) => {
    if (!date1 && !date2) {
      return null;
    }
    return new Date(Math.max(new Date(date1), new Date(date2)));
  },
  min: (date1, date2) => {
    if (!date1 && !date2) {
      return null;
    }
    if (!date1) {
      return new Date(date2);
    }
    if (!date2) {
      return new Date(date1);
    }
    return new Date(Math.min(new Date(date1), new Date(date2)));
  },
  formatDate: (date) => {
    if (!date) {
      return "";
    }
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${d.getFullYear()}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  },
  formatHumanISO: (date) => {
    if (!date) {
      return "";
    }
    return new Date(date).toISOString().split('T').join(' ').split('.')[0];
  },
  isSameDay: (date1, date2) => {
    return dateUtils.formatDate(date1) === dateUtils.formatDate(date2);
  },
  isAdjoiningDate: (date1, date2) => {
    if(!date1 || !date2){
      return false;
    }
    const d1=new Date(date1);
    const d2=new Date(date2);
    const start = d1<d2 ? d1 : d2;
    const end = d1<d2 ? d2 : d1;
    return ((end - start)/1000/60/60/24) <= 1
  },
  addDays: (date, days) => {
    if (!date) {
      return null;
    }
    const newDate = new Date(new Date(date).valueOf());
    newDate.setDate(newDate.getDate() + (days || 0));
    return newDate;
  },
  getWeekStart: (date) => {
    return dateUtils.addDays(date, (new Date(date).getDay() * -1));
  },
  getWeekEnd: (date) => {
    const weekEndDate = dateUtils.addDays(dateUtils.addDays(dateUtils.getWeekStart(date), 7), -1);
    return new Date(dateUtils.formatDate(weekEndDate) + " 23:59:59");
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
    return words.map((w) => {
      return w.charAt(0).toUpperCase() + w.split('').splice(1, w.length).join('');
    }).join(" ");
  },
  getMatchingStartingWord: (string, startingList) => {
    for (let i in startingList) {
      if (string.toLowerCase().split(' ').indexOf(startingList[i].toLowerCase()) === 0) {
        return string.split(' ')[0];
      }
    }
    return null;
  }
};

const objectUtils = {
  clone:(o)=>{
    return JSON.parse(JSON.stringify(o));
  }
};

module.exports.string = stringUtils;
module.exports.date = dateUtils;
module.exports.array = arrayUtils;
module.exports.object = objectUtils;
