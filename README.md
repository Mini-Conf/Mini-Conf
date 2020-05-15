# MiniConf

MiniConf is a set of tools and templates for designing a virtual conference portal based on the work of ICLR 2020. 

The design goals are:

* Completely s
* Easy to 



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
