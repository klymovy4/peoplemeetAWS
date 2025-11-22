
function formatDateTimeForSQL(d) {
	const year = d.getFullYear();
	const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
	const day = d.getDate().toString().padStart(2, '0');
	const hours = d.getHours().toString().padStart(2, '0');
	const minutes = d.getMinutes().toString().padStart(2, '0');
	const seconds = d.getSeconds().toString().padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const twelveHoursAgo = formatDateTimeForSQL(new Date(Date.now() - 12 * 60 * 60 * 1000));

console.log(twelveHoursAgo);
console.log(formatDateTimeForSQL(new Date()));
