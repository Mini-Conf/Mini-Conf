# Mini Conf

Template for a miniature virtual conference portal.  


### Installation
```
pip install -r requirements.txt
```
Replace `pip` with `pip3` according to your system.


## Files

* Static files js/css/image `static/`
* Site and configuration data files yaml/json `sitedata/`
* HTML Template files `templates/pages`


### Test
```
bash run.sh or sh run.sh
```
For Starting the server => goto http://localhost:5000


### Make static pages
```
bash freeze.sh or sh freeze.sh
```
Puts the static pages in `build/`

### Code

Code is all in `main.py`

###  Html Pages

Main Html pages are included in `templates/pages/`
