from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


@dataclass(frozen=True)
class SessionInfo:
    """The session information for a paper."""

    session_name: str
    start_time: datetime
    end_time: datetime
    zoom_link: str
    ical_link: str

    @property
    def time_string(self) -> str:
        return "({}-{} GMT)".format(
            self.start_time.strftime("%H:%M"), self.end_time.strftime("%H:%M")
        )

    @property
    def session(self) -> str:
        start_day = self.start_time.strftime("%a")
        return f"{start_day} Session {self.session_name}"


@dataclass(frozen=True)
class PaperContent:
    """The content of a paper.

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
    sessions: List[SessionInfo]
    similar_paper_uids: List[str]

    @property
    def TLDR(self) -> str:
        return self.abstract[:250] + "..."


@dataclass(frozen=True)
class Paper:
    """The paper dataclass.

    This corresponds to an entry in the `papers.json`.
    See the `start()` method in static/js/papers.js.
    """

    id: str
    forum: str
    content: PaperContent

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
