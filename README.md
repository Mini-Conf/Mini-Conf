## Mini-Conf

<a href="https://mini-conf.github.io/index.html">MiniConf</a> is a virtual conference in a box. It is:

* Completely static
* Requires no database.
* Trivial to modify.

To get started just `pip install -r requirements.txt` and run `./run.sh `. When you are ready to deploy run
`./freeze.sh` to get a static version of the site. 


### Tour


1) *Datastore* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/sitedata">`sitedata/`</a>

Collection of CSV files representing the papers, speakers, workshops, and other important information for the conference.

2) *Routing* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/main.py">`main.py`</a>

One file flask-server handles simple data preprocessing and site navigation. 

3) *Templates* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/templates">`templates/`</a>

Contains all the pages for the site. See `base.html` for the master page and `components.html` for core components.

4) *Frontend* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/static">`static/`</a>

Contains frontend components like the default css, images, and javascript libs.

5) *Scripts* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/scripts">`scripts/`</a>

Contains additional preprocessing to add visualizations and recommendations to the conference. 


### Example

Mini-Conf was design to host <a href="https://iclr.cc/virtual_2020">ICLR 2020</a> a virtual conference with 6000 participants. 

### Acknowledgements

Thanks to Darren Nelson for the original design sketches. Shakir Mohamed, Martha White, Kyunghyun Cho, Lee Campbell, and Adam White for planning and feedback. Junaid Rahim, Jake Tae, Yasser Souri, Soumya Chatterjee, and Ankshita Gupta for contributions. 

