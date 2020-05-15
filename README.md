
<img src="https://github.com/Mini-Conf/Mini-Conf/raw/master/static/images/MiniConf.png">

MiniConf is a set of tools and templates for designing a virtual conference portal based on the work of ICLR 2020 (https://iclr.cc/virtual_2020)

The out-of-the box MiniConf setting is viewable here: https://mini-conf.github.io/index.html

The design goals are:

* Completely static: everything is HTML / JS.
* No database: everything is generated from CSV / YAML / ICS 
* Super easy to modify: move and change components directly. 

Under the hood the system is written in Flask, with < 100 lines of python code. 


### Quickstart

Install:
```
pip install -r requirements.txt
```

Run locally
```
bash run.sh 
```

After starting the server => goto http://localhost:5000


## Files

The main files to edit to control the configuration are: 

* "Database": `sitedata/`
* "Routing": `main.py`
* "Templates": `templates/`
* "Frontend": `static/`



### Deploy
```
bash freeze.sh 
```
Puts the static pages in `build/`. This is the whole site, you can just copy to your server or deploy to github pages.
