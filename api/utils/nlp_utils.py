"""NLP utilities: keyword extraction, skill matching, ATS scoring."""
import re
from typing import List, Tuple, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import spacy
except ImportError:  # pragma: no cover - spaCy optional in serverless envs
    spacy = None

_NLP = None


def get_nlp():
    """Lazily load spaCy model (small English model). Returns None if unavailable."""
    global _NLP
    if _NLP is None and spacy is not None:
        try:
            _NLP = spacy.load("en_core_web_sm")
        except OSError:
            _NLP = spacy.blank("en")
    return _NLP


# Curated skill taxonomy grouped by category for skill-distribution chart.
SKILL_TAXONOMY: Dict[str, List[str]] = {
    "Programming Languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "go",
        "rust", "ruby", "php", "swift", "kotlin", "sql", "r", "scala",
    ],
    "Frontend": [
        "react", "angular", "vue", "html", "css", "tailwind", "redux",
        "next.js", "webpack", "sass", "bootstrap", "framer motion",
    ],
    "Backend": [
        "node.js", "express", "django", "flask", "fastapi", "spring",
        "rest api", "graphql", "microservices", "nestjs",
    ],
    "Database": [
        "postgresql", "mysql", "mongodb", "redis", "sqlite", "dynamodb",
        "elasticsearch", "firebase",
    ],
    "Cloud & DevOps": [
        "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "jenkins",
        "terraform", "linux", "git", "github actions", "vercel",
    ],
    "Data & AI": [
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "pandas", "numpy", "scikit-learn", "nlp", "spacy", "data analysis",
        "data visualization", "ai",
    ],
    "Soft Skills": [
        "leadership", "communication", "teamwork", "problem solving",
        "project management", "agile", "scrum", "collaboration",
        "time management", "mentoring",
    ],
}

ALL_SKILLS: List[str] = sorted(
    {s for skills in SKILL_TAXONOMY.values() for s in skills}
)

STOPWORDS = set(
    """a about above after again against all am an and any are aren't as at be
    because been before being below between both but by can't cannot could
    couldn't did didn't do does doesn't doing don't down during each few for
    from further had hadn't has hasn't have haven't having he he'd he'll he's
    her here here's hers herself him himself his how how's i i'd i'll i'm i've
    if in into is isn't it it's its itself let's me more most mustn't my
    myself no nor not of off on once only or other ought our ours ourselves
    out over own same shan't she she'd she'll she's should shouldn't so some
    such than that that's the their theirs them themselves then there there's
    these they they'd they'll they're they've this those through to too under
    until up very was wasn't we we'd we'll we're we've were weren't what what's
    when when's where where's which while who who's whom why why's with won't
    would wouldn't you you'd you'll you're you've your yours yourself
    yourselves""".split()
)


def extract_keywords(text: str, top_n: int = 30) -> List[str]:
    """Extract top keywords/phrases from text using TF-IDF on unigrams+bigrams."""
    text = text.lower()
    if not text.strip():
        return []
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english",
        max_features=200,
        token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z+#.\-]*\b",
    )
    try:
        tfidf = vectorizer.fit_transform([text])
    except ValueError:
        return []
    scores = tfidf.toarray()[0]
    terms = vectorizer.get_feature_names_out()
    pairs = sorted(zip(terms, scores), key=lambda x: x[1], reverse=True)
    keywords = [term for term, score in pairs if score > 0][:top_n]
    return keywords


def find_skills_in_text(text: str) -> List[str]:
    """Return all known skills (from taxonomy) present in given text."""
    text_lower = text.lower()
    found = []
    for skill in ALL_SKILLS:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def compute_tfidf_similarity(resume_text: str, jd_text: str) -> float:
    """Cosine similarity between resume and JD using TF-IDF (0-100 scale)."""
    if not resume_text.strip() or not jd_text.strip():
        return 0.0
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        matrix = vectorizer.fit_transform([resume_text, jd_text])
    except ValueError:
        return 0.0
    sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    return round(float(sim) * 100, 2)


def calculate_ats_score(resume_text: str, jd_text: str) -> Tuple[dict, List[str], List[str]]:
    """
    Calculate ATS score, matched/missing keywords.
    Returns (ats_result_dict, matched_keywords, missing_keywords)
    """
    resume_lower = resume_text.lower()

    if jd_text.strip():
        jd_keywords = extract_keywords(jd_text, top_n=25)
        jd_skills = find_skills_in_text(jd_text)
        combined_jd_terms = sorted(set(jd_keywords + jd_skills))
    else:
        # No JD provided: use general skill taxonomy as baseline
        combined_jd_terms = ALL_SKILLS

    matched = []
    missing = []
    for term in combined_jd_terms:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(term) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, resume_lower):
            matched.append(term)
        else:
            missing.append(term)

    total = len(combined_jd_terms) if combined_jd_terms else 1
    match_percentage = round((len(matched) / total) * 100, 2)

    similarity_score = compute_tfidf_similarity(resume_text, jd_text) if jd_text.strip() else match_percentage

    # ATS score: weighted blend of keyword match % and semantic similarity
    ats_score = round((match_percentage * 0.6) + (similarity_score * 0.4), 2)
    ats_score = min(ats_score, 100.0)

    result = {
        "ats_score": ats_score,
        "match_percentage": match_percentage,
        "matched_keywords": matched[:40],
        "missing_keywords": missing[:40],
        "total_jd_keywords": total,
        "total_matched": len(matched),
    }
    return result, matched, missing


def build_skill_distribution(resume_text: str) -> List[dict]:
    """Count matched skills per taxonomy category."""
    found_skills = set(find_skills_in_text(resume_text))
    distribution = []
    for category, skills in SKILL_TAXONOMY.items():
        count = sum(1 for s in skills if s in found_skills)
        distribution.append({"category": category, "count": count})
    return distribution


def build_radar_chart(resume_text: str, jd_text: str) -> List[dict]:
    """Build radar chart data comparing resume skill presence vs JD requirement."""
    resume_skills = set(find_skills_in_text(resume_text))
    jd_skills = set(find_skills_in_text(jd_text)) if jd_text.strip() else set()

    radar_data = []
    for category, skills in SKILL_TAXONOMY.items():
        resume_count = sum(1 for s in skills if s in resume_skills)
        jd_count = sum(1 for s in skills if s in jd_skills) if jd_skills else len(skills) // 2

        resume_pct = round((resume_count / len(skills)) * 100, 1)
        jd_pct = round((jd_count / len(skills)) * 100, 1) if jd_skills else 50.0

        radar_data.append({
            "skill": category,
            "resume_score": resume_pct,
            "jd_requirement": jd_pct,
        })
    return radar_data
