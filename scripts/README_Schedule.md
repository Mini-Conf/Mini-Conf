## Adding a schedule to MiniConf

1) Create a Calendar in you favorite calendar application.
Be sure that you can export calendars as `.ics` files. 
2) [optional] use the `location` field for links that you want to link out from 
the calendar view (e.g. filtered poster sessions). 
3) [optional] use hashtags in front of events to classify them.
4) run the `parse_calendar.py` script:

```bash
python parse_calendar.py --in sample_cal.ics
``` 

### Example

An entry like this in iCal or Google Cal:

```
title: #talk Homer Simpson
location: http://abc.de
start: 7:00pm ET 
```

will appear in the schedule as box in color `#cccccc` (see `sitedate/config.yml`):

```
7:00 Homer Simpson
```
and will link to `http://abc.de`  on click. 

### Pro Tip

If you plan to add some infos automatically, you can create a script that 
modifies `sitedate/main_calendar.json`  
