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

module.exports.string = stringUtils;
module.exports.date = dateUtils;
module.exports.array = arrayUtils;
