from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class PosterContent:
    """The content of a poster.

    Needs to be synced with static/js/papers.js and static/js/paper_vis.js.
    """
    # needs to be synced with
    title: str
    authors: List[str]
    track: str
    abstract: str
    keywords: List[str]
    pdf_url: Optional[str]
    demo_url: Optional[str]
    sessions: List[str]
    recs: List[str]

    @property
    def TLDR(self) -> str:
        return self.abstract[:250] + "..."


@dataclass(frozen=True)
class Poster:
    id: str
    forum: str
    content: PosterContent

    @property
    def rocketchat_channel(self) -> str:
        return f"paper-{self.id.replace('.', '-')}"


@dataclass(frozen=True)
class Keynote:
    id: str
    speaker: str
    slides_link: str
    qa_link: str
    title: str
    image: str
    institution: str
    day: str
    time: str
    zoom: str
    abstract: str
    bio: str


@dataclass(frozen=True)
class CommitteeMember:
    role: str
    name: str
    aff: str
    im: Optional[str]
    tw: Optional[str]


@dataclass(frozen=True)
class Tutorial:
    id: str
    title: str
    organizers: List[str]
    abstract: str
    material: str


@dataclass(frozen=True)
class Workshop:
    id: str
    title: str
    organizers: List[str]
    abstract: str
    material: str
