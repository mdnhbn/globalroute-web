# Language: Python | Target: Job Matching, CV/Cover Letter & Visa Guide API Routes
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.services.career_visa_service import (
    build_cv_and_cover_letter,
    get_visa_roadmap,
    match_jobs_for_profile,
)

router = APIRouter(prefix="/career", tags=["Job Matching, CV & Visa Guide"])


class CvCoverLetterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., min_length=4, max_length=255)
    phone: str = Field(..., min_length=5, max_length=40)
    current_country: str = Field(..., min_length=2, max_length=100)
    target_country: str = Field(..., min_length=2, max_length=100)
    job_title: str = Field(..., min_length=2, max_length=150)
    experience_years: int = Field(default=1, ge=0, le=50)
    skills_summary: str = Field(..., min_length=2)
    employer_name: str = Field(default="Hiring Manager", max_length=150)


@router.get("/jobs/match")
def jobs_match(
    target_country: str = Query(default="Canada"),
    job_category: str = Query(default="driver"),
    experience_years: int = Query(default=2, ge=0, le=50),
):
    return {
        "matches": match_jobs_for_profile(
            target_country=target_country,
            job_category=job_category,
            experience_years=experience_years,
        )
    }


@router.post("/cv-cover-letter")
def generate_cv_letter(payload: CvCoverLetterRequest):
    return build_cv_and_cover_letter(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        current_country=payload.current_country,
        target_country=payload.target_country,
        job_title=payload.job_title,
        experience_years=payload.experience_years,
        skills_summary=payload.skills_summary,
        employer_name=payload.employer_name,
    )


@router.get("/visa-roadmap")
def visa_roadmap(
    origin_country: str = Query(default="Bangladesh"),
    destination_country: str = Query(default="Canada"),
):
    return get_visa_roadmap(
        origin_country=origin_country,
        destination_country=destination_country,
    )
