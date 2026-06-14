"""NLP utilities: keyword extraction, skill matching, ATS scoring.

Pure-Python implementation (no numpy/scipy/scikit-learn/spacy) to keep the
Vercel serverless function bundle well under the 250MB unzipped limit.
"""
import re
import math
from collections import Counter
from typing import List, Tuple, Dict


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

ENGLISH_STOPWORDS = set(
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

_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z+#.\-]*")


def _tokenize(text: str) -> List[str]:
    """Lowercase + extract word tokens, dropping stopwords and 1-char tokens."""
    tokens = _TOKEN_RE.findall(text.lower())
    cleaned = []
    for t in tokens:
        # Strip trailing punctuation (e.g. "experience." -> "experience"),
        # but keep recognized multi-part terms like "node.js" or "c++/c#".
        if t not in ALL_SKILLS:
            t = t.strip(".-+#")
        if t and t not in ENGLISH_STOPWORDS and len(t) > 1:
            cleaned.append(t)
    return cleaned


def _ngrams(tokens: List[str], n: int) -> List[str]:
    if n == 1:
        return tokens
    return [" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


def extract_keywords(text: str, top_n: int = 30) -> List[str]:
    """
    Extract top keywords/phrases from text using a simple TF score over
    unigrams and bigrams (pure Python, no sklearn).
    """
    text = text.strip()
    if not text:
        return []
    tokens = _tokenize(text)
    if not tokens:
        return []

    unigrams = tokens
    bigrams = _ngrams(tokens, 2)

    counts = Counter(unigrams)
    counts.update(bigrams)

    # Rank by frequency, slight boost for bigrams (more specific phrases)
    scored = []
    for term, count in counts.items():
        weight = count * (1.3 if " " in term else 1.0)
        scored.append((term, weight))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [term for term, _ in scored[:top_n]]


def find_skills_in_text(text: str) -> List[str]:
    """Return all known skills (from taxonomy) present in given text."""
    text_lower = text.lower()
    found = []
    for skill in ALL_SKILLS:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def _term_frequencies(tokens: List[str]) -> Dict[str, float]:
    """Return normalized term frequency vector (as a dict) for a token list."""
    total = len(tokens) or 1
    counts = Counter(tokens)
    return {term: count / total for term, count in counts.items()}


def compute_similarity(resume_text: str, jd_text: str) -> float:
    """
    Cosine similarity between resume and JD using simple term-frequency
    vectors (pure Python). Returns a 0-100 scale score.
    """
    if not resume_text.strip() or not jd_text.strip():
        return 0.0

    resume_tokens = _tokenize(resume_text)
    jd_tokens = _tokenize(jd_text)
    if not resume_tokens or not jd_tokens:
        return 0.0

    vec_a = _term_frequencies(resume_tokens)
    vec_b = _term_frequencies(jd_tokens)

    all_terms = set(vec_a) | set(vec_b)
    dot = sum(vec_a.get(t, 0.0) * vec_b.get(t, 0.0) for t in all_terms)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = dot / (norm_a * norm_b)
    return round(similarity * 100, 2)


# Backwards-compatible alias used elsewhere in the codebase
compute_tfidf_similarity = compute_similarity


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

    similarity_score = compute_similarity(resume_text, jd_text) if jd_text.strip() else match_percentage

    # ATS score: weighted blend of keyword match % and term-overlap similarity
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
