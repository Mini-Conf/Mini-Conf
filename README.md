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

### Extensions

Miniconf is designed to be a completely static solution. However it is designed to integrate well with dynamic third-party solutions. We directly support the following providers: 

* Rocket.Chat: The `chat/` directory contains descriptions for setting up a hosted Rocket.Chat instance and for embedding chat rooms on individual paper pages. You can either buy a hosted setting from Rocket.chat or we include instructions for running your own scalable instance through sloppy.io. 

* Auth0 : The code can integrate through Auth0.com to provide both page login (through javascript gating) and OAuth SSO with Rocket Chat. The documentation on Auth0 is very easy to follow, you simply need to create an Application for both the Miniconf site and the Rocket.Chat server. You then enter in the Client keys to the appropriate configs. 

* SlidesLive: It is easy to embedded any video provider -> YouTube, Vimeo, etc. However we have had great experience with SlidesLive and recommend them as a host. We include a slideslive example on the main page. 

* PDF.js: For conferences that use posters it is easy to include an embedded pdf on poster pages. An example is given. 


### Example

Mini-Conf was originally built to host <a href="https://iclr.cc/virtual_2020">ICLR 2020</a> a virtual conference with 6000 participants. 

* ACMC 2020 (Australian Computer Music Conference): https://acmc2020.com/index.html
* ACL 2020 (Australian Computer Music Conference): https://virtual.acl2020.org/index.html
* AKBC 2020 (Automated Knowledge Base Construction) : https://akbc.apps.allenai.org/index.html
* ICLR 2020 (International Conference on Learning Representations): https://iclr.cc/virtual_2020
* Data Science Capstone Exhibition, University of Pretoria: https://up-mitc-ds.github.io/808exhibition2020/index.html

### Acknowledgements

MiniConf was built by [Hendrik Strobelt](http://twitter.com/hen_str) and [Sasha Rush](http://twitter.com/srush_nlp).

Thanks to Darren Nelson for the original design sketches. Shakir Mohamed, Martha White, Kyunghyun Cho, Lee Campbell, and Adam White for planning and feedback. Hao Fang, Junaid Rahim, Jake Tae, Yasser Souri, Soumya Chatterjee, and Ankshita Gupta for contributions. 




