import argparse
import csv
import json
import re
import subprocess

from bs4 import BeautifulSoup
import requests


def parse_arguments():
    parser = argparse.ArgumentParser(description="Parse published proceedings")

    parser.add_argument(
        "--url",
        default="https://dl.acm.org/doi/proceedings/10.1145/3368555",
        type=str,
        help="URL of conference proceedings",
    )

    parser.add_argument(
        "--out",
        default="../sitedata/papers.csv", help="Output file"
    )

    parser.add_argument(
        "--download_pdf",
        type=bool,
        default=False, help="Download the PDFs"
    )

    parser.add_argument(
        "--thumbnail",
        type=bool,
        default=False, help="Generate thumbnail images. Requires ImageMagick"
    )

    return parser.parse_args()


class Paper:
    """
    Represents a single publication in the proceedings. Populates metadata from
    the CrossRef API and ACM proceedings.
    """
    def __init__(self, doi):
        self.doi = doi
        self.uid = self.doi.split('/')[1]
        self.crossref_metadata = None
        self.title = None
        self.subtitle = None
        self.full_title = None
        self.author_list = None
        self.url_html = None
        self.url_pdf = None
        self.abstract = None
        self.topics = None

    def __str__(self):
        return f'{self.doi}'

    def __repr__(self):
        return 'Paper Object'

    def get_metadata(self):
        """
        Get title, subtitle, authors, abstract, URL, keywords.
        """
        self._get_metadata_crossref()
        self._get_metadata_acm()

    def row_for_sitedata(self):
        """
        Exports the paper details for the sitedata CSV.
        """
        uid = f'{self.uid}'
        title = f'{self.full_title}'
        authors = "|".join([f"{x['given']} {x['family']}"
                            for x in self.author_list])
        abstract = f'{self.abstract}'
        keywords = "|".join([x for x in self.topics])
        pdf_url = "static/pdf/" + uid + ".pdf"

        return [uid, title, authors, abstract, keywords, pdf_url]

    def _get_metadata_crossref(self):
        """
        Get json metadata from crossref using the DOI.
        """
        base_url = "https://api.crossref.org/v1/works/"
        target_url = base_url + self.doi
        metadata = requests.get(target_url).text

        self.crossref_metadata = json.loads(metadata)['message']
        self.title = self.crossref_metadata['title'][0]
        self.subtitle = self.crossref_metadata['subtitle']

        if self.subtitle:
            self.full_title = self.title + ": " + self.subtitle[0]
        else:
            self.full_title = self.title
        self.author_list = self.crossref_metadata['author']
        self.url_html = self.crossref_metadata['URL']

    def _get_metadata_acm(self):
        """
        Get additional metadata from the HTML version of the article.
        """
        soup = BeautifulSoup(requests.get(self.url_html).text, "html.parser")
        self.abstract = soup.find(class_="abstractSection abstractInFull").text
        self.url_pdf = "https://dl.acm.org/doi/pdf/" + self.doi

        org_chart = soup.find("ol", class_="rlist organizational-chart")
        self.topics = [x.text for x in
                       org_chart.find_all("a", href=re.compile(r"^/topic/"))]


def convert(args):
    """
    Parse the index page, getting details of each paper in the collection.
    """
    file: str = args.url
    if file.startswith("http"):
        soup = BeautifulSoup(requests.get(file).text, "html.parser")
    else:
        sys.exit("Input URL must begin with http")

    output_fn = args.out
    thumbnail = args.thumbnail
    download_pdf = args.download_pdf

    # create a dictionary containing the papers
    papers = {}
    for href in soup.find_all("h5", class_="issue-item__title"):
        doi = href.find('a')['href'].strip('/doi/abs/')
        papers[doi] = Paper(doi)
        papers[doi].get_metadata()

    # write to CSV
    header = ["UID", "title", "authors", "abstract", "keywords", "pdf_url"]
    with open(output_fn, 'w') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for k in papers:
            row = papers[k].row_for_sitedata()
            writer.writerow(row)

    if download_pdf:
        pdf_folder = "../static/pdf/"
        for k in papers:
            response = requests.get(papers[k].url_pdf)
            fn = pdf_folder + papers[k].uid + ".pdf"
            with open(fn, 'wb') as f:
                f.write(response.content)

    # requires ImageMagick
    if thumbnail:
        pdf_folder = "../static/pdf/"
        thumbnail_folder = "../static/images/papers/"
        for k in papers:
            # [0] indicates first page only
            source_fn = papers[k].uid + ".pdf" + "[0]"
            target_fn = papers[k].uid + ".png"
            params = ['convert', pdf_folder + source_fn,
                      thumbnail_folder + target_fn]
            subprocess.check_call(params)


if __name__ == "__main__":
    args = parse_arguments()
    convert(args)