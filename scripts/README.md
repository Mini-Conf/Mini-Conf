This directory contains extensions to help support the mini-conf library.

These include:

* Image-Extraction: https://github.com/Mini-Conf/image-extraction for pulling images from PDF files. 


* embeddings.py : For turning abstracts into embeddings.

Creates an `embeddings.torch` file.

```
python embeddings.py ../sitedata/papers.csv
```

* reduce.py : For creating two-dimensional representations of the embeddings.


```
python embeddings.py ../sitedata/papers.csv embeddings.torch > ../sitedata/papers_projection.json
```
