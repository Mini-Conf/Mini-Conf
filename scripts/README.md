This directory contains extensions to help support the mini-conf library.

These include:

* `embeddings.py` : For turning abstracts into embeddings. Creates an `embeddings.torch` file. 

```bash
python embeddings.py ../sitedata/papers.csv
```

* `generate_version.py` : Generate version file for version tracking.  This script is used in [../Makefile](../Makefile)

```bash
python3 scripts/generate_version.py build/version.json
```

* `reduce.py` : For creating two-dimensional representations of the embeddings.

```bash
python embeddings.py ../sitedata/papers.csv embeddings.torch > ../sitedata/papers_projection.json
```

* `parse_calendar.py` : to convert a local or remote ICS file to JSON. -- more on importing calendars see [README_Schedule.md](README_Schedule.md)

```bash
python parse_calendar.py --in sample_cal.ics
```

* Image-Extraction: https://github.com/Mini-Conf/image-extraction for pulling images from PDF files. 

