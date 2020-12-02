## MiniConf

<a href="https://mini-conf.github.io/index.html">MiniConf</a> is a virtual conference in a box. It manages the papers, schedules, and speakers for an academic conference run virtually. It can be easily integrated with interactive tools such as video, chat, and QA.

<img src="https://raw.githubusercontent.com/Mini-Conf/Mini-Conf/master/miniconf.gif">

MiniConf was originally built to host <a href="https://iclr.cc/virtual_2020">ICLR 2020</a> a virtual conference with 6000 participants and have been used to host a wide variety of major conferences.

* ACMC 2020 (Australian Computer Music Conference): https://acmc2020.com/index.html
* ACM-CHIL 2020 (Conference on Health, Inference, and Learning) https://www.chilconference.org/
* ACL 2020 (Association of Computational Linguistics): https://virtual.acl2020.org/index.html
* AISTATS 2020 (International Conference on Artificial Intelligence and Statistics): https://aistats2020.net/
* AKBC 2020 (Automated Knowledge Base Construction) : https://akbc.apps.allenai.org/index.html
* EMNLP 2020 (Empirical Methods in NLP): https://virtual.2020.emnlp.org/index.html
* ICLR 2020 (International Conference on Learning Representations): https://iclr.cc/virtual_2020
* ICML 2020 (International Conference on Machine Learning): https://icml.cc/virtual/2020/index.html
* IEEE VIS 2020 (IEEE conference on Visualization and Visual Analytics): https://virtual.ieeevis.org/
* NeurIPS 2020 (Neural Information Processing Systems Conference): https://neurips.cc/virtual/2020/public/
* SIGIR 2020 (Information Retrieval): https://sigir-schedule.baai.ac.cn/papers
* Data Science Capstone Exhibition, University of Pretoria: https://up-mitc-ds.github.io/808exhibition2020/index.html

It is designed to be:

* Run based on static files hosted by any server. 
* Modifiable without a database using CSV files.
* Easy to extend to fit any backend or additional frontend tools. 

## Links
Demo system: <a href='http://www.mini-conf.org'> http://www.mini-conf.org</a>

Source Code: <a href='https://github.com/Mini-Conf/Mini-Conf'> https://github.com/Mini-Conf/Mini-Conf</a>

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

MiniConf is designed to be a completely static solution. However it is designed to integrate well with dynamic third-party solutions. We directly support the following providers: 

* Rocket.Chat: The `chat/` directory contains descriptions for setting up a hosted Rocket.Chat instance and for embedding chat rooms on individual paper pages. You can either buy a hosted setting from Rocket.chat or we include instructions for running your own scalable instance through sloppy.io. 

* Auth0 : The code can integrate through Auth0.com to provide both page login (through javascript gating) and OAuth SSO with Rocket Chat. The documentation on Auth0 is very easy to follow, you simply need to create an Application for both the MiniConf site and the Rocket.Chat server. You then enter in the Client keys to the appropriate configs. 

* SlidesLive: It is easy to embedded any video provider -> YouTube, Vimeo, etc. However we have had great experience with SlidesLive and recommend them as a host. We include a slideslive example on the main page. 

* PDF.js: For conferences that use posters it is easy to include an embedded pdf on poster pages. An example is given. 


### Acknowledgements

MiniConf was built by [Hendrik Strobelt](http://twitter.com/hen_str) and [Sasha Rush](http://twitter.com/srush_nlp).

Thanks to Darren Nelson for the original design sketches. Shakir Mohamed, Martha White, Kyunghyun Cho, Lee Campbell, and Adam White for planning and feedback. Hao Fang, Junaid Rahim, Jake Tae, Yasser Souri, Soumya Chatterjee, and Ankshita Gupta for contributions. 

### Citation
Feel free to cite MiniConf:
```bibtex
@misc{RushStrobelt2020,
    title={MiniConf -- A Virtual Conference Framework},
    author={Alexander M. Rush and Hendrik Strobelt},
    year={2020},
    eprint={2007.12238},
    archivePrefix={arXiv},
    primaryClass={cs.HC}
}
```


