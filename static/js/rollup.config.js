export default {
	entry: './ical_fullcalendar.js',
	format: 'umd',
	dest: './ical2fullcalendar.js',
	moduleName: 'ical2fullcalendar',
	globals: {
		'ical.js': 'ICAL'
	}
};
