# Mini-Conf - Data Description

All data for Mini-Conf can be provided either as CSV, JSON, or YAML. 
So it does not matter if you provide a `papers.csv` or a `papers.yml` as long as
the required data fields are provided.

## Global Configuration (config.yml)

- name: `<short name>`
- tagline: `<long name>`
- date: `<Date of conference>`
- proceedings_title: `<proceedings name for citation>`
- analytics: `<Google analytics ID starting with UA... >`
- logo: 
    - image: `<link to logo>`
    - width: `<width of the image> or "auto"`
    - height: `<height of the image> or "auto"`
- site_title: `<name of the site>`
- page_title:
    - prefix: `<text to include in title of every page>`
    - separator: `<characters between prefix and name of the current page>`
- background_image: `<link to background image>`
- organization: `<conference committee name>`
- chat_server: `<url of rocket chat server, if used>`

## Detail Pages

### committee [.csv | .json | .yml]
The list of members of the orga team visible on the landing page

  - role: `<Chair name>` 
  - name: `<Name>`
  - aff: `<Affiliation>`
  - im: `<Image URL>`
  - tw: `<Twitter name>`
  
 Example (.yml):
 ```yaml
committee:
  - role: Procrastination Chair 
    name: Homer Simpson
    aff: Springfield University
    im: https://en.wikipedia.org/wiki/Homer_Simpson#/media/File:Homer_Simpson_2006.png 
```

<hr>

### papers [.csv | .json | .yml]
The list of papers.

- UID: `<Unique ID>`
- title: `<paper title>`
- authors: `<list of authors>` -- (seperated by `|` in CSV)
- abstract: `<abstract text>`
- keywords: `<list of keywords>` -- (seperated by `|` in CSV)  
- sessions: `<list of session IDs>` --  (seperated by `|` in CSV) 

Example (.csv):
```csv
UID,title,authors,abstract,keywords,sessions
B1xSperKvH,Donuts Holes are the Best,Homer Simpson|Bart Simpson,"Donuts are the cause for a lot of taste.",donuts|food|joy,S1|S3
```

<hr>

### speakers [.csv | .json | .yml]
The list of keynote talks.

- UID: `<Unique ID>`
- title: `<talk title>`
- institution: `<affiliation>`
- speaker: `<speaker name>`
- abstract: `<talk abstract>`
- bio: `<short bio>`
- session: `<session ID>`

Example (.csv):
```csv
UID,title,institution,speaker,abstract,bio,session
1,"AI + Africa = Global Innovation","IBM Research Africa, Nairobi",Dr. Aisha Walcott-Bryant,"Artificial Intelligence (AI) has for some time stoked the creative fires of computer scientists and researchers world-wide -- even before the so-called AI winter. After emerging from the winter, with much improved compute, vast amounts of data, and new techniques, AI has ignited our collective imaginations. We have been captivated by its promise while wary of its possible misuse in applications. AI has certainly demonstrated its enormous potential especially in fields such as healthcare. There, it has been used to support radiologists and to further precision medicine; conversely it has been used to generate photorealistic videos which distort our concept of what is real.  Hence, we must thoughtfully harness AI to address the myriad of scientific and societal challenges; and open pathways to opportunities in governance, policy, and management. In this talk, I will share innovative solutions which leverage AI for global health with a focus on Africa. I will present a vision for the collaborations in hopes to inspire our community to join on this journey to transform Africa and impact the world.","Dr. Aisha Walcott-Bryant is a research scientist and manager of the AI Science and Engineering team at IBM Research, Africa. She is passionate about healthcare, interactive systems, and on addressing Africa's diverse challenges.In addition, Dr. Walcott-Bryant leads a team of researchers and engineers who are working on transformational innovations in global health and development while advancing the state of the art in AI, Blockchain, and other technologies.She and her team are engaged in projects in Maternal Newborn Child Health (MNCH), Family Planning (FP), disease intervention planning, and water access and management.  Her team's recent healthcare work on “Enabling Care Continuity Using a Digital Health Wallet” was awarded Honorable Mention at the International Conference on Health Informatics, ICHI2019.Prior to her career at IBM Research Africa, Dr. Walcott-Bryant worked in Spain. There, she took on projects in the area of Smarter Cities at Barcelona Digital and Telefonica with a focus on physical systems for social media engagement, and multi-modal trip planning and recommending. Dr. Walcott-Bryant earned her PhD in Electrical Engineering and Computer Science at MIT where she conducted research on mobile robot navigation in dynamic environments at their Computer Science and Artificial Intelligence Lab (CSAIL).",S2
```

<hr>

### workshops [.csv | .json | .yml]
The list of workshops or socials.

- UID: `<Unique ID>`
- title: `<workshop title>`
- authors: `<organizer names>`
- abstract: `<abstract text>`
- [TBD] url: `<external link>`

<hr>

### faq [.json | .yml]
The list of FAQ questions partitioned into sections.

 - Section: `<Section Name>`
 - QA:
      - Question: `<Question>`
      - Answer: `<Answer>`

Example (.yml):
```yaml
FAQ:
  - Section: Test Section
    QA:
      - Question: What is a good question?
        Answer: "Here are the answers"
```

