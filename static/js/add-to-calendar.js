// Modified based on https://github.com/commonpike/add-to-calendar-buttons/blob/master/add-to-calendar.js.
;(function(exports) {

  /* --------------
     config 
  --------------- */
  
  var MS_IN_MINUTES = 60 * 1000;
    
  var CONFIG = {
    selector  : ".add-to-calendar",
    duration  : 60,
    texts : {
      label     : "Add to Calendar",
      title     : "New event",
      download  : "Calendar-event.ics",
      google    : "Google",
      yahoo     : "Yahoo!",
      off365    : "Office365",
      ical      : "iCal",
      outlook   : "Outlook",
      ienoblob  : "Sorry, your browser does not support downloading Calendar events."
    }
  };
  
  if (typeof ADDTOCAL_CONFIG != "undefined") {
    CONFIG = ADDTOCAL_CONFIG;
  }
  
  /* --------------
    browser sniffing 
  --------------- */
  
  // ie < edg (=chromium) doesnt support data-uri:text/calendar
  var ieCanDownload = ('msSaveOrOpenBlob' in window.navigator);
  var ieMustDownload = /\b(MSIE |Trident.*?rv:|Edge\/)(\d+)/.exec(navigator.userAgent);
  
  
  /* --------------
    generators 
  --------------- */
  
  var calendarGenerators = {
  
    google: function(event) {
      var startTime,endTime;
      
      if (event.allday) {
        // google wants 2 consecutive days at 00:00
        startTime = formatTime(event.tzstart);
        endTime = formatTime(getEndDate(event.tzstart,60*24));
        startTime = stripISOTime(startTime);
        endTime = stripISOTime(endTime);
      } else {
        if (event.timezone) {
          // google is somehow weird with timezones. 
          // it works better when giving the local
          // time in the given timezone without the zulu, 
          // and pass timezone as argument.
          // but then the dates we have loaded 
          // need to shift inverse with tzoffset the 
          // browser gave us. 
          // so
          var shiftstart, shiftend;
          shiftstart = new Date(event.start.getTime()-event.start.getTimezoneOffset()*MS_IN_MINUTES);
          if (event.end) {
            shiftend = new Date(event.end.getTime()-event.end.getTimezoneOffset()*MS_IN_MINUTES);
          }
          startTime = formatTime(shiftstart);
          endTime = formatTime(shiftend);
          // strip the zulu and pass the tz as argument later
          startTime = startTime.substring(0,startTime.length-1);
          endTime = endTime.substring(0,endTime.length-1);
        } else {
          // use regular times
          startTime = formatTime(event.start);
          endTime = formatTime(event.end);
        }
      }
      
      var href = encodeURI([
        'https://www.google.com/calendar/render',
        '?action=TEMPLATE',
        '&text=' + (event.title || ''),
        '&dates=' + (startTime || ''),
        '/' + (endTime || ''),
        (event.timezone)?'&ctz='+event.timezone:'',
        '&details=' + (event.description || ''),
        '&location=' + (event.address || ''),
        '&sprop=&sprop=name:'
      ].join(''));
      
      
      return '<a class="cal-icon-google" target="_blank" href="' +
        href + '">'+CONFIG.texts.google+'</a>';
    },

    yahoo: function(event) {
    
      
      if (event.allday) {
        var yahooEventDuration = 'allday';
      } else {
      
        var eventDuration = event.tzend ?
        ((event.tzend.getTime() - event.tzstart.getTime())/ MS_IN_MINUTES) :
        event.duration;

        // Yahoo dates are crazy, we need to convert the duration from minutes to hh:mm
      
      
        var yahooHourDuration = eventDuration < 600 ?
          '0' + Math.floor((eventDuration / 60)) :
          Math.floor((eventDuration / 60)) + '';
  
        var yahooMinuteDuration = eventDuration % 60 < 10 ?
          '0' + eventDuration % 60 :
          eventDuration % 60 + '';
  
        var yahooEventDuration = yahooHourDuration + yahooMinuteDuration;
      }
      
      // Remove timezone from event time
      // var st = formatTime(new Date(event.start - (event.start.getTimezoneOffset() * MS_IN_MINUTES))) || '';
      
      var st = formatTime(event.tzstart) || '';

      var href = encodeURI([
        'http://calendar.yahoo.com/?v=60&view=d&type=20',
        '&title=' + (event.title || ''),
        '&st=' + st,
        '&dur=' + (yahooEventDuration || ''),
        '&desc=' + (event.description || ''),
        '&in_loc=' + (event.address || '')
      ].join(''));

      return '<a class="icon-yahoo" target="_blank" href="' +
        href + '">'+CONFIG.texts.yahoo+'</a>';
    },

    off365: function(event) {
      var startTime = formatTime(event.tzstart);
      var endTime = formatTime(event.tzend);
      
      var href = encodeURI([
        'https://outlook.office365.com/owa/',
        '?path=/calendar/action/compose',
        '&rru=addevent',
        '&subject=' + (event.title || ''),
        '&startdt=' + (startTime || ''),
        '&enddt=' + (endTime || ''),
        '&body=' + (event.description || ''),
        '&location=' + (event.address || ''),
        '&allday=' + (event.allday)?'true':'false'
      ].join(''));
      return '<a class="icon-off365" target="_blank" href="' +
        href + '">'+CONFIG.texts.off365+'</a>';
    },
    
    ics: function(event, eClass, calendarName) {
      var startTime,endTime;

      if (event.allday) {
        // DTSTART and DTEND need to be equal and 0
        startTime = formatTime(event.tzstart);
        endTime = startTime = stripISOTime(startTime)+'T000000';
      } else {
        startTime = formatTime(event.tzstart);
        endTime = formatTime(event.tzend);
      }
      
      var cal = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'BEGIN:VEVENT',
          'URL:' + document.URL,
          'DTSTART:' + (startTime || ''),
          'DTEND:' + (endTime || ''),
          'SUMMARY:' + (event.title || ''),
          'DESCRIPTION:' + (event.description || ''),
          'LOCATION:' + (event.address || ''),
          'UID:' + (event.id || '') + '-' + document.URL,
          'END:VEVENT',
          'END:VCALENDAR'].join('\n');
          
      if (ieMustDownload) {
        return '<a class="' + eClass + '" onclick="ieDownloadCalendar(\'' +
          escapeJSValue(cal) + '\')">' + calendarName + '</a>';
      }
      
      var href = encodeURI('data:text/calendar;charset=utf8,' + cal);
      
      return '<a class="' + eClass + '" download="'+CONFIG.texts.download+'" href="' + 
        href + '">' + calendarName + '</a>';
     
      
    },

    ical: function(event) {
      return this.ics(event, 'icon-ical', CONFIG.texts.ical);
    },

    outlook: function(event) {
      return this.ics(event, 'icon-outlook', CONFIG.texts.outlook);
    }
  };
  
  /* --------------
     helpers 
  --------------- */
  
  var changeTimezone = function(date,timezone) {
    if (date) {
      if (timezone) {
        var invdate = new Date(date.toLocaleString('en-US', { 
          timeZone: timezone 
        }));
        var diff = date.getTime()-invdate.getTime();
        return new Date(date.getTime()+diff);
      } 
      return date;
    }
    return;
  }
  
  var formatTime = function(date) {
    return date?date.toISOString().replace(/-|:|\.\d+/g, ''):'';
  };
  
  var getEndDate = function(start,duration) {
    return new Date(start.getTime() + duration * MS_IN_MINUTES);
  };

  var stripISOTime = function(isodatestr) {
    return isodatestr.substr(0,isodatestr.indexOf('T'));
  };
  
  var escapeJSValue = function(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '\\\'')
      .replace(/(\r?\n|\r)/gm, '\\n');
  };
  
  /* --------------
     output handling 
  --------------- */

  var generateMarkup = function(calendars, clazz, calendarId) {
    var result = document.createElement('div');

    result.innerHTML = '<label for="checkbox-for-' +
      calendarId + '" class="add-to-calendar-label">'+CONFIG.texts.label+'</label>';
    result.innerHTML += '<input name="add-to-calendar-checkbox" class="add-to-calendar-checkbox" id="checkbox-for-' + calendarId + '" type="checkbox" ' +
      ' onclick="closeCalenderOnMouseDown(this)">';

    var dropdown = document.createElement('div');
    dropdown.className = 'add-to-calendar-dropdown';
    
    Object.keys(calendars).forEach(function(services) {
      dropdown.innerHTML += calendars[services];
    });

    result.appendChild(dropdown);
    
    result.className = 'add-to-calendar-widget';
    if (clazz !== undefined) {
      result.className += (' ' + clazz);
    }

    addCSS();
    
    result.id = calendarId;
    return result;
  };

  var generateCalendars = function(event) {
    return {
      google: calendarGenerators.google(event),
      yahoo: calendarGenerators.yahoo(event),
      off365: calendarGenerators.off365(event),
      ical: calendarGenerators.ical(event),
      outlook: calendarGenerators.outlook(event)
    };
  };

  var addCSS = function() {
    if (!document.getElementById('add-to-calendar-css')) {
      document.getElementsByTagName('head')[0].appendChild(generateCSS());
    }
  };

  var generateCSS = function() {
    var styles = document.createElement('style');
    styles.id = 'add-to-calendar-css';

    styles.innerHTML = ".add-to-calendar{position:relative;text-align:left}.add-to-calendar>*{display:none}.add-to-calendar>.add-to-calendar-widget{display:block}.add-to-calendar-label{cursor:pointer}.add-to-calendar-checkbox+div.add-to-calendar-dropdown{display:none;margin-left:20px}.add-to-calendar-checkbox:checked+div.add-to-calendar-dropdown{display:block}input[type=checkbox].add-to-calendar-checkbox{position:absolute;visibility:hidden}.add-to-calendar-checkbox+div.add-to-calendar-dropdown a{cursor:pointer;display:block}.add-to-calendar-checkbox+div.add-to-calendar-dropdown a:before{width:16px;height:16px;display:inline-block;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAAAQCAYAAACIoli7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0MzJCRDU2NUE1MDIxMUUyOTY1Q0EwNTkxNEJDOUIwNCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo0MzJCRDU2NkE1MDIxMUUyOTY1Q0EwNTkxNEJDOUIwNCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjQzMkJENTYzQTUwMjExRTI5NjVDQTA1OTE0QkM5QjA0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQzMkJENTY0QTUwMjExRTI5NjVDQTA1OTE0QkM5QjA0Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+1Gcb3QAACh1JREFUeNrEWAtw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);margin-right:.5em;content:' '}.icon-ical:before{background-position:-68px 0}.icon-yahoo:before{background-position:-36px +4px}.cal-icon-google:before{background-position:-52px 0}.add-to-calendar-widget{font-family:sans-serif;margin:1em 0;position:relative}.add-to-calendar-label{display:inline-block;background-color:#fff;background-image:url(data:image/vndmicrosofticon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/wAAAAAAAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb///////////9WVlb///////////9WVlb///////////9WVlb///////////9WVlb/VlZW/wAAAABWVlb/VlZW////////////VlZW////////////VlZW////////////VlZW////////////VlZW/1ZWVv8AAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb///////////9WVlb///////////9WVlb///////////9WVlb///////////9WVlb/VlZW/wAAAABWVlb/VlZW////////////VlZW////////////VlZW////////////VlZW////////////VlZW/1ZWVv8AAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb///////////9WVlb///////////9WVlb///////////9WVlb///////////9WVlb/VlZW/wAAAABWVlb/VlZW////////////VlZW////////////VlZW////////////VlZW////////////VlZW/1ZWVv8AAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/wAAAAAAAAAAVlZW/1ZWVv///////////1ZWVv9WVlb/VlZW/1ZWVv9WVlb///////////9WVlb/VlZW/wAAAAAAAAAAAAAAAAAAAABWVlb///////////9WVlb/AAAAAAAAAAAAAAAAVlZW////////////VlZW/wAAAAAAAAAAAAAAAAAAAAAAAAAAVlZW/1ZWVv9WVlb/VlZW/wAAAAAAAAAAAAAAAFZWVv9WVlb/VlZW/1ZWVv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==);background-position:10px 45%;background-repeat:no-repeat;padding:1em 1em 1em 40px;background-size:20px 20px;border-radius:3px;box-shadow:0 0 0 .5px rgba(50,50,93,.17),0 2px 5px 0 rgba(50,50,93,.1),0 1px 1.5px 0 rgba(0,0,0,.07),0 1px 2px 0 rgba(0,0,0,.08),0 0 0 0 transparent!important}.add-to-calendar-dropdown{position:absolute;z-index:99;background-color:#fff;top:0;left:0;padding:1em;margin:0!important;border-radius:3px;box-shadow:0 0 0 .5px rgba(50,50,93,.17),0 2px 5px 0 rgba(50,50,93,.1),0 1px 1.5px 0 rgba(0,0,0,.07),0 1px 2px 0 rgba(0,0,0,.08),0 0 0 0 transparent!important}.add-to-calendar-dropdown a{display:block;line-height:1.75em;text-decoration:none;color:inherit;opacity:.7}.add-to-calendar-dropdown a:hover{opacity:1}";
    return styles;
  };
 

  /* --------------
     input handling 
  --------------- */
  
  var sanitizeParams = function(params) {
    if (!params.options) {
      params.options = {}
    }
    if (!params.options.id) {
      params.options.id = Math.floor(Math.random() * 1000000);
    }
    if (!params.options.class) {
      params.options.class = '';
    }
    if (!params.data) {
      params.data = {};
    }
    if (!params.data.start) {
    	params.data.start=new Date();
    }
    if (params.data.allday) {
      delete params.data.end; // may be set later
      delete params.data.duration;
    }
    if (params.data.end) {
      delete params.data.duration;
    } else {
      if (!params.data.duration) {
        params.data.duration = CONFIG.duration;
      }
    }
    if (params.data.duration) {
      params.data.end = getEndDate(params.data.start,params.data.duration);
    }
    
    if (params.data.timezone) {
      params.data.tzstart = changeTimezone(params.data.start,params.data.timezone);
      params.data.tzend = changeTimezone(params.data.end,params.data.timezone);
    } else {
      params.data.tzstart = params.data.start;
      params.data.tzend = params.data.end;
    }
    if (!params.data.title) {
      params.data.title = CONFIG.texts.title;
    }
   
    
  };
  
  var validParams = function(params) {
    return params.data !== undefined && params.data.start !== undefined &&
      (params.data.end !== undefined || params.data.allday !== undefined);
  };
  
  var parseCalendar = function(elm) {
    
    /*
      <div title="Add to Calendar" class="addtocalendar">
        <span class="start">12/18/2018 08:00 AM</span>
        <span class="end">12/18/2018 10:00 AM</span>
        <span class="duration">45</span>
        <span class="allday">true</span>
        <span class="timezone">America/Los_Angeles</span>
        <span class="title">Summary of the event</span>
        <span class="description">Description of the event</span>
        <span class="location">Location of the event</span>
      </div>
    */

    var data = {}, node;
    
    node = elm.querySelector('.start');
    if (node) data.start = new Date(node.textContent);
    
    node = elm.querySelector('.end');
    if (node) data.end = new Date(node.textContent);
    
    node = elm.querySelector('.duration');
    if (node) data.duration = 1*node.textContent;
    
    node = elm.querySelector('.allday');
    if (node) data.allday = true;
    
    node = elm.querySelector('.title');
    if (node) data.title = node.textContent;
    
    node = elm.querySelector('.description');
    if (node) data.description = node.textContent;
    
    node = elm.querySelector('.address');
    if (node) data.address = node.textContent;
    if (!data.address) {
      node = elm.querySelector('.location');
      if (node) data.address = node.textContent;
    }
    
    node = elm.querySelector('.timezone');
    if (node) data.timezone = node.textContent;
    
    cal = createCalendar({data:data});
    if (cal) elm.appendChild(cal);
    return cal;
    
  }
  
  /* --------------
     exports 
  --------------- */

  exports.ieDownloadCalendar = function(cal) {
    if (ieCanDownload) {
      var blob = new Blob([cal], { type: 'text/calendar' });
      window.navigator.msSaveOrOpenBlob(blob, CONFIG.texts.download);
    } else {
      alert(CONFIG.texts.ienoblob);
    }
  };

  exports.closeCalenderOnMouseDown = function(checkbox) {
    //console.log('check');
    var closeCalendar = function() { 
      //console.log('click');
      setTimeout(function() { checkbox.checked=false; }, 750);
      document.removeEventListener("mousedown",closeCalendar);
    };
    document.addEventListener("mousedown",closeCalendar);
  }
  
  exports.addToCalendarData = function(params) {
  	if (!params) params = {};
  	sanitizeParams(params);
    if (!validParams(params)) {
      console.error('Event details missing.');
      return;
    }
    return generateCalendars(params.data);
  }
  
  // bwc
  exports.createCalendar = function(params) {
    return addToCalendar(params);
  };
  
  exports.addToCalendar = function(params) {
    
    if (!params) params = {};
    
    if (params instanceof HTMLElement) {
      //console.log('HTMLElement');
      return parseCalendar(params);
    }
    
    if (params instanceof NodeList) {
      //console.log('NodeList');
      var success = (params.length>0);
      Array.prototype.forEach.call(params, function(node) { 
        success = success && addToCalendar(node);
      }); 
      return success;
    }
    
    sanitizeParams(params);
    
    if (!validParams(params)) {
      console.error('Event details missing.');
      return;
    }

    return generateMarkup(
      generateCalendars(params.data),
      params.options.class,
      params.options.id
   );
   
  };
  
  // document.ready
  
  document.addEventListener("DOMContentLoaded", function(event) { 
    addToCalendar(document.querySelectorAll(CONFIG.selector));
  });
  
})(this);
