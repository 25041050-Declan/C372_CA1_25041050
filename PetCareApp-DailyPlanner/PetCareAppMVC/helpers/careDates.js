const singapore = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'});
function today(now = new Date()) { return singapore.format(now); }
function shift(day, n) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0,10);
}
function due(r, day) {
  return day >= r.starts && (!r.ends || day <= r.ends) &&
    (r.weekday === null || r.weekday === new Date(day+'T12:00:00Z').getUTCDay());
}
module.exports = {today, shift, due};
