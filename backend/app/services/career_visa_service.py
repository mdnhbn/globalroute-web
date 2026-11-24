# Language: Python | Target: Job Matching, Country CV/Cover Letter & Visa Guide Service
from typing import Any


CATALOG_JOBS: list[dict[str, Any]] = [
    {
        "id": "job-ca-01",
        "title": "Heavy Truck Driver (Class 1 / AZ)",
        "country": "Canada",
        "region": "North America",
        "category": "driver",
        "min_years": 2,
        "employer": "Prairie Freight & Logistics Ltd.",
        "salary_range": "$4,200 - $5,500 CAD / month",
        "reference_url": "https://www.jobbank.gc.ca/home",
        "cv_format": "North American ATS Resume (No Photo)",
    },
    {
        "id": "job-pt-01",
        "title": "Commercial Kitchen Chef & Line Cook",
        "country": "Portugal",
        "region": "Europe",
        "category": "chef",
        "min_years": 2,
        "employer": "Atlantic Hospitality Group",
        "salary_range": "€1,250 - €1,750 / month",
        "reference_url": "https://eures.europa.eu/index_en",
        "cv_format": "Europass CV Format",
    },
    {
        "id": "job-it-01",
        "title": "Seasonal & Long-Term Farm / Agricultural Worker",
        "country": "Italy",
        "region": "Europe",
        "category": "agriculture",
        "min_years": 1,
        "employer": "Emilia AgriCoop S.r.l.",
        "salary_range": "€1,300 - €1,650 / month",
        "reference_url": "https://eures.europa.eu/index_en",
        "cv_format": "Europass CV Format",
    },
    {
        "id": "job-jp-01",
        "title": "Food Processing & Care / Hospitality Worker",
        "country": "Japan",
        "region": "Asia",
        "category": "general",
        "min_years": 1,
        "employer": "Kanto Support & Services K.K.",
        "salary_range": "¥210,000 - ¥270,000 / month",
        "reference_url": "https://www.hellowork.mhlw.go.jp/",
        "cv_format": "Japan Rirekisho (履歴書) Format",
    },
    {
        "id": "job-de-01",
        "title": "MIG/TIG Welder & Metal Fabricator",
        "country": "Germany",
        "region": "Europe",
        "category": "welder",
        "min_years": 2,
        "employer": "Rheinmetall & Partner Works",
        "salary_range": "€2,400 - €3,200 / month",
        "reference_url": "https://www.make-it-in-germany.com/en/",
        "cv_format": "Europass CV Format",
    },
]


def match_jobs_for_profile(
    target_country: str,
    job_category: str,
    experience_years: int,
) -> list[dict[str, Any]]:
    country_q = target_country.strip().lower()
    cat_q = job_category.strip().lower()
    exp_val = max(0, int(experience_years))

    results: list[dict[str, Any]] = []
    for job in CATALOG_JOBS:
        score = 35
        if country_q and (country_q in job["country"].lower() or country_q in job["region"].lower()):
            score += 35
        if cat_q and (cat_q in job["category"].lower() or cat_q in job["title"].lower()):
            score += 20
        if exp_val >= int(job["min_years"]):
            score += 10

        results.append(
            {
                **job,
                "match_score": min(100, score),
            }
        )

    results.sort(key=lambda item: item["match_score"], reverse=True)
    return results


def build_cv_and_cover_letter(
    full_name: str,
    email: str,
    phone: str,
    current_country: str,
    target_country: str,
    job_title: str,
    experience_years: int,
    skills_summary: str,
    employer_name: str = "Hiring Manager",
) -> dict[str, str]:
    dest_lower = target_country.strip().lower()
    if dest_lower in ("japan",):
        cv_format = "Japan Rirekisho (履歴書) Format"
    elif dest_lower in ("canada", "usa", "united states", "america"):
        cv_format = "North American ATS Resume Format"
    else:
        cv_format = "Europass Standard CV Format"

    cv_text = (
        f"FORMAT: {cv_format}\n"
        f"FULL NAME: {full_name}\n"
        f"CONTACT: {email} | {phone}\n"
        f"CURRENT LOCATION: {current_country}\n"
        f"TARGET ROLE & COUNTRY: {job_title} ({target_country})\n"
        f"EXPERIENCE: {experience_years} year(s)\n"
        f"CORE SKILLS & CERTIFICATIONS: {skills_summary}\n"
    )

    cover_letter = (
        f"Dear {employer_name},\n\n"
        f"I am writing to apply for the {job_title} position in {target_country}. "
        f"Currently based in {current_country}, I bring {experience_years} year(s) of practical experience "
        f"and strong reliability in {skills_summary}.\n\n"
        f"My passport, identity documents, and work records are prepared for visa sponsorship and onboarding. "
        f"Thank you for your time and consideration.\n\n"
        f"Sincerely,\n{full_name}\n{phone} | {email}"
    )

    return {
        "cv_format": cv_format,
        "cv_document": cv_text,
        "cover_letter": cover_letter,
    }


def get_visa_roadmap(origin_country: str, destination_country: str) -> dict[str, Any]:
    origin_clean = origin_country.strip() or "Bangladesh"
    dest_clean = destination_country.strip() or "Canada"

    return {
        "origin_country": origin_clean,
        "destination_country": dest_clean,
        "required_documents": [
            "Valid Passport (minimum 6-12 months validity)",
            "National ID / Birth Certificate & Driving License (if applicable)",
            "Job Offer / Employment Contract & Sponsorship Reference",
            "Police Clearance Certificate",
            "Medical Fitness Report (GAMCA / IOM / Approved Panel Clinic)",
            "Bank Statement & Travel/Medical Insurance",
        ],
        "estimated_official_fees": "Varies by visa subclass, biometrics, and embassy/VFS service fee (verify on official embassy/VFS portal).",
        "submission_guidance": (
            f"Check the official Embassy / Consulate or authorized VFS / Application Center operating in {origin_clean} "
            f"for {dest_clean} work/residence visa appointments and document submission."
        ),
    }
