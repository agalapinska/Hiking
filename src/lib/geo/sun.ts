/** Sunrise / sunset in local minutes from midnight (NOAA simplified algorithm). */
export function sunTimes(lat: number, lng: number, date = new Date()): { sunrise: number; sunset: number } {
	const rad = Math.PI / 180;
	const start = Date.UTC(date.getFullYear(), 0, 0);
	const doy = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
	const gamma = ((2 * Math.PI) / 365) * (doy - 1 + (12 - 12) / 24);
	const eqtime =
		229.18 *
		(0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
	const decl =
		0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
	const cosHa = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
	if (cosHa > 1) return { sunrise: 0, sunset: 0 };
	if (cosHa < -1) return { sunrise: 0, sunset: 1440 };
	const ha = Math.acos(cosHa) / rad;
	const tzOff = -date.getTimezoneOffset();
	const sunrise = 720 - 4 * (lng + ha) - eqtime + tzOff;
	const sunset = 720 - 4 * (lng - ha) - eqtime + tzOff;
	return { sunrise, sunset };
}
