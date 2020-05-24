## Mini-Conf

<a href="https://mini-conf.github.io/index.html">MiniConf</a> is a virtual conference in a box. It manages the papers, schedules, and speakers for an academic conference run virtually. It can be easily integrated with interactive tools such as video, chat, and QA.

<img src="https://raw.githubusercontent.com/Mini-Conf/Mini-Conf/master/miniconf.gif">

It is designed to be:

* Run based on static files hosted by any server. 
* Modifiable without a database using CSV files.
* Easy to extend to fit any backend or additional frontend tools. 

## Get Started

<pre>
> pip install -r requirements.txt
> make run
</pre>

When you are ready to deploy run `make freeze` to get a static version of the site in the `build` folder. 


### Tour

The <a href="https://github.com/Mini-Conf/Mini-Conf">MiniConf</a> repo:

1) *Datastore* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/sitedata">`sitedata/`</a>

Collection of CSV files representing the papers, speakers, workshops, and other important information for the conference.

2) *Routing* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/main.py">`main.py`</a>

One file flask-server handles simple data preprocessing and site navigation. 

3) *Templates* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/templates">`templates/`</a>

Contains all the pages for the site. See `base.html` for the master page and `components.html` for core components.

4) *Frontend* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/static">`static/`</a>

Contains frontend components like the default css, images, and javascript libs.

5) *Scripts* <a href="https://github.com/Mini-Conf/Mini-Conf/tree/master/scripts">`scripts/`</a>

Contains additional preprocessing to add visualizations, recommendations, schedules to the conference. 

6) For importing calendars as schedule see [scripts/README_Schedule.md](https://github.com/Mini-Conf/Mini-Conf/blob/master/scripts/README_Schedule.md)

### Example

Mini-Conf was design to host <a href="https://iclr.cc/virtual_2020">ICLR 2020</a> a virtual conference with 6000 participants. 

### Acknowledgements

MiniConf was built by [Hendrik Strobelt](http://twitter.com/hen_str) and [Sasha Rush](http://twitter.com/srush_nlp).

Thanks to Darren Nelson for the original design sketches. Shakir Mohamed, Martha White, Kyunghyun Cho, Lee Campbell, and Adam White for planning and feedback. Hao Fang, Junaid Rahim, Jake Tae, Yasser Souri, Soumya Chatterjee, and Ankshita Gupta for contributions. 




