import os, uuid
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models.base import Base
from models.template import Template, TemplateSection, FieldType, VersionTarget
from models.user import User, UserRole
from passlib.context import CryptContext


load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"), echo=True)
pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"])  # Changed from bcrypt to pbkdf2_sha256 for Windows compatibility

IQMD_SECTIONS = [
    # key,                          display_name,                                    target,             field_type,       locked, placeholder
    ("header",                      "Protocol Header Table",                          "both",             "auto_fill",       True,  "Auto-populated from patient record"),
    ("key_objective_data",          "Key Objective Data",                             "physician",        "rich_text",       False, "Insert patient-specific interpretation here."),
    ("clinical_problem_list",       "Clinical Problem List",                          "physician",        "rich_text",       False, "Insert patient-specific interpretation here."),
    ("detailed_lab_interpretation", "Detailed Laboratory Interpretation (Physician)", "physician",        "rich_text",       False, "Insert patient-specific interpretation here."),
    ("dna_genetics_analysis",       "DNA Methylation & Genetics Analysis (Physician)","physician",        "rich_text",       False, "Insert patient-specific interpretation here."),
    ("provider_directed_plan",      "Provider-Directed Plan",                         "physician",        "rich_text",       False, "Insert patient-specific interpretation here."),
    ("monitoring_follow_up",        "Monitoring & Follow-Up",                         "physician",        "rich_text",       False, "Insert patient-specific interpretation here."),
    ("patient_header",              "Protocol Header Table (Patient)",                "patient",          "auto_fill",       True,  "Auto-populated from patient record"),
    ("current_regimen",             "Current Regimen",                                "patient",          "rich_text",       False, "Insert patient-facing language here."),
    ("supplements_patient",         "Supplements",                                    "patient",          "rich_text",       False, "Insert patient-facing language here."),
    ("simple_lab_interpretation",   "Simple Lab Interpretation (Patient)",            "patient",          "rich_text",       False, "Insert patient-facing language here."),
    ("dna_summary",                 "DNA Summary (Simple Explanation)",               "patient",          "rich_text",       False, "Insert patient-facing language here."),
    ("what_to_do_now",              "What To Do Now",                                 "patient",          "rich_text",       False, "Insert patient-facing language here."),
    ("supplement_table",            "Final Supplementation List",                     "both",             "supplement_table",False, "Add supplements using the table below."),
    ("membership",                  "IQMD Membership Levels",                         "both",             "locked_table",    True,  ""),
]

MEMBERSHIP_DATA = {
    "tiers": [
        {
            "name": "Gold Membership",
            "price": "$109/month",
            "benefits": [
                "30% off Pure Encapsulations supplements",
                "20% off Thorne vitamins",
                "30% off IV infusions plus rotating 50% off deals",
                "Access to premium peptides including GH, NAD+, Mounjaro, and Glutathione",
                "One free lab panel per year",
                "Priority scheduling and concierge text access during business hours",
                "Discounts on prescription medications with first priority"
            ]
        },
        {
            "name": "Hormone Optimization Membership",
            "price": "$75/month",
            "benefits": [
                "Personalized hormone treatment plan including BHRT, peptides, and labs",
                "30% off Pure Encapsulations hormone, adrenal, and metabolic support",
                "20% off Thorne vitamins",
                "20% off IV infusions plus rotating 50% off deals",
                "Discounts on peptides including Mounjaro, Ozempic, NAD+, GH, and Glutathione",
                "Discounts on prescription medications including hormone therapies",
                "10 yearly visits or texts with prescriptions"
            ]
        },
        {
            "name": "Silver Membership",
            "price": "$49.99/month",
            "benefits": [
                "20% off Pure Encapsulations supplements",
                "10% off Thorne vitamins",
                "10% off IV infusions",
                "Discounts on prescription medications",
                "Option to upgrade anytime to higher tiers",
                "Annual lab panel",
                "5 yearly visits or texts with prescriptions"
            ]
        }
    ]
}

def seed():
    with Session(engine) as db:
        # -- Seed admin user --
        existing = db.query(User).filter(User.email == "admin@iqmd.com").first()
        if not existing:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@iqmd.com",
                password_hash=pwd_ctx.hash("IQMDAdmin2026!"),
                role=UserRole.admin,
                first_name="IQMD",
                last_name="Admin",
            )
            db.add(admin)
            print("Admin user created with email: admin@iqmd.com and password: IQMDAdmin2026!")
        else:
            existing.password_hash = pwd_ctx.hash("IQMDAdmin2026!")

        physician = db.query(User).filter(User.email == "physician@iqmd.com").first()
        if not physician:
            physician = User(
                id=str(uuid.uuid4()),
                email="physician@iqmd.com",
                password_hash=pwd_ctx.hash("IQMDDoc2026!"),
                role=UserRole.physician,
                first_name="IQMD",
                last_name="Physician",
            )
            db.add(physician)
            print("Physician user created with email: physician@iqmd.com and password: IQMDDoc2026!")
        else:
            physician.password_hash = pwd_ctx.hash("IQMDDoc2026!")

        # -- Seed IQMD Master template --
        existing_tmpl = db.query(Template).filter(Template.name == "IQMD Master Template 2026").first()
        if not existing_tmpl:
            template = Template(
                id=str(uuid.uuid4()),
                name="IQMD Master Template 2026",
                focus_category="general",
                version="1.0",
                is_locked=True,
                is_system=True,
                description="The locked IQMD Master Template. Physician and patient sections, supplementation list, and membership levels.",
                ai_system_prompt=(
                    "You are an IQMD functional medicine assistant. "
                    "Interpret the patient labs, compare with prior labs, and generate an IQMD protocol. "
                    "Keep the physician section detailed and clinical. "
                    "Keep the patient section simple and actionable. "
                    "Recommend only from the approved supplement, peptide, IV, and medication list provided. "
                    "Do not add outside products unless explicitly requested."
                ),
            )
            db.add(template)
            db.flush()  # get template.id

            for i, (key, name, target, ftype, locked, placeholder) in enumerate(IQMD_SECTIONS, start=1):
                section = TemplateSection(
                    id=str(uuid.uuid4()),
                    template_id=template.id,
                    order_index=i,
                    section_key=key,
                    display_name=name,
                    version_target=VersionTarget(target),
                    field_type=FieldType(ftype),
                    is_locked=locked,
                    placeholder=placeholder,
                )
                db.add(section)

            print(f"IQMD Master Template seeded with {len(IQMD_SECTIONS)} sections")

        db.commit()
        print("Seeding complete")

if __name__ == "__main__":
    seed()
