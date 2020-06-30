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

    @property
    def time_string(self) -> str:
        return "({}-{} GMT)".format(
            self.start_time.strftime("%H:%M"), self.end_time.strftime("%H:%M")
        )

    @property
    def session(self) -> str:
        start_day = self.start_time.strftime("%a")
        if self.session_name.startswith("D"):
            # demo sessions
            return f"Demo Session {self.session_name[1:]} {start_day}"
        return f"Session {self.session_name} {start_day}"


@dataclass(frozen=True)
class PaperContent:
    """The content of a paper.

    Needs to be synced with static/js/papers.js and static/js/paper_vis.js.
    """

    # needs to be synced with
    title: str
    authors: List[str]
    track: str
    paper_type: str
    abstract: str
    tldr: str
    keywords: List[str]
    pdf_url: Optional[str]
    demo_url: Optional[str]
    sessions: List[SessionInfo]
    similar_paper_uids: List[str]

    def __post_init__(self):
        assert self.track, self
        if self.pdf_url:
            assert self.pdf_url.startswith("https://"), self.pdf_url
        if self.demo_url:
            assert self.demo_url.startswith("https://"), self.demo_url
        assert self.paper_type[0].isupper(), self


@dataclass(frozen=True)
class Paper:
    """The paper dataclass.

    This corresponds to an entry in the `papers.json`.
    See the `start()` method in static/js/papers.js.
    """

    id: str
    forum: str
    card_image_path: str
    presentation_id: str
    content: PaperContent

    @property
    def rocketchat_channel(self) -> str:
        return f"paper-{self.id.replace('.', '-')}"


@dataclass(frozen=True)
class PlenarySession:
    id: str
    title: str
    image: str
    date: str
    day: str
    time: Optional[str]
    speaker: Optional[str]
    institution: Optional[str]
    abstract: Optional[str]
    bio: Optional[str]
    # SlidesLive presentation ID
    presentation_id: Optional[str]
    rocketchat_channel: Optional[str]
    qa_time: Optional[str]
    zoom_link: Optional[str]


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
    prerecorded: Optional[str]
    livestream: Optional[str]
    zoom_link: Optional[str]
    session1_time: Optional[str]
    session2_time: Optional[str]
    virtual_format_description: str


@dataclass(frozen=True)
class Workshop:
    id: str
    title: str
    organizers: List[str]
    abstract: str
    material: str
    prerecorded: Optional[str]
    livestream: Optional[str]
    virtual_format_description: str
