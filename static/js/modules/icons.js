const icon_video = (size) => {
  size = size || 32;
  return `<svg class="icon_video" focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" 
viewBox="0 0 32 32" aria-hidden="true"><path d="M21,26H4a2,2,0,0,1-2-2V8A2,2,0,0,1,4,6H21a2,2,0,0,1,2,2v4.06l5.42-3.87A1,1,0,0,1,30,9V23a1,1,0,0,1-1.58.81L23,19.94V24A2,2,0,0,1,21,26Z"></path>
<title>Live</title></svg>`;
};

const icon_cal = (size) => {
  size = size || 32;
  return `<svg class="icon_cal" focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" 
viewBox="0 0 32 32" aria-hidden="true">
<path d="M21,30a8,8,0,1,1,8-8A8,8,0,0,1,21,30Zm0-14a6,6,0,1,0,6,6A6,6,0,0,0,21,16Z"></path>
<polygon points="22.59 25 20 22.41 20 18 22 18 22 21.59 24 23.59 22.59 25"></polygon><path d="M28,6a2,2,0,0,0-2-2H22V2H20V4H12V2H10V4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2h4V26H6V6h4V8h2V6h8V8h2V6h4v6h2Z"></path>
<title>Export Cal</title></svg>`;
};
