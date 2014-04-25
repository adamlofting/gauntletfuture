function toInt(s) {
  s = s.replace(/,/g, "");
  return parseInt(s);
}

function isValidDate(date) {
  if (!date) {
    return false;
  }
  date = new Date(date);
  if (Object.prototype.toString.call(date) === "[object Date]") {
    if (isNaN(date.getTime())) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

/**
 * Convert a JS date to string "YYYY-MM-DD"
 * @param  {Date} date
 * @return {str}
 */
function dateToISOtring(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2); // 0 index
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

module.exports = {
  dateToISOtring: dateToISOtring,
  isValidDate: isValidDate,
  toInt: toInt,
};
