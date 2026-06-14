"""
HR Portal – SQLAlchemy ORM Models
==================================
Mirrors the PostgreSQL schema defined in db/schema.sql.
Each class maps 1-to-1 with a database table.
"""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ---------------------------------------------------------------------------
# Python-side Enum mirrors
# ---------------------------------------------------------------------------

class EmploymentStatus(str, enum.Enum):
    active      = "active"
    inactive    = "inactive"
    on_leave    = "on_leave"
    terminated  = "terminated"
    probation   = "probation"


class EmploymentType(str, enum.Enum):
    full_time   = "full_time"
    part_time   = "part_time"
    contract    = "contract"
    intern      = "intern"
    freelance   = "freelance"


class AttendanceStatus(str, enum.Enum):
    present         = "present"
    absent          = "absent"
    half_day        = "half_day"
    work_from_home  = "work_from_home"
    on_leave        = "on_leave"
    holiday         = "holiday"


class ProjectStatus(str, enum.Enum):
    planning    = "planning"
    active      = "active"
    on_hold     = "on_hold"
    completed   = "completed"
    cancelled   = "cancelled"


class ProjectRole(str, enum.Enum):
    lead        = "lead"
    developer   = "developer"
    designer    = "designer"
    analyst     = "analyst"
    tester      = "tester"
    devops      = "devops"
    manager     = "manager"
    other       = "other"


class SkillProficiency(str, enum.Enum):
    beginner        = "beginner"
    intermediate    = "intermediate"
    advanced        = "advanced"
    expert          = "expert"


# ---------------------------------------------------------------------------
# Declarative base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# 1. Employee
# ---------------------------------------------------------------------------

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    first_name:    Mapped[str] = mapped_column(String(100), nullable=False)
    last_name:     Mapped[str] = mapped_column(String(100), nullable=False)
    email:         Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
    phone:         Mapped[Optional[str]]  = mapped_column(String(20))
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    hire_date:     Mapped[date]           = mapped_column(Date, nullable=False, server_default=func.current_date())
    termination_date: Mapped[Optional[date]] = mapped_column(Date)
    department:    Mapped[Optional[str]]  = mapped_column(String(100))
    job_title:     Mapped[Optional[str]]  = mapped_column(String(150))
    manager_id:    Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType, name="employment_type"),
        nullable=False,
        default=EmploymentType.full_time,
    )
    employment_status: Mapped[EmploymentStatus] = mapped_column(
        Enum(EmploymentStatus, name="employment_status"),
        nullable=False,
        default=EmploymentStatus.active,
    )
    salary:              Mapped[Optional[Decimal]]  = mapped_column(Numeric(12, 2))
    profile_picture_url: Mapped[Optional[str]]      = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    manager:             Mapped[Optional["Employee"]]           = relationship("Employee", remote_side="Employee.id", foreign_keys=[manager_id])
    direct_reports:      Mapped[List["Employee"]]               = relationship("Employee", back_populates="manager", foreign_keys=[manager_id])
    attendance_records:  Mapped[List["Attendance"]]             = relationship("Attendance", back_populates="employee", foreign_keys="Attendance.employee_id", cascade="all, delete-orphan")
    project_assignments: Mapped[List["ProjectAssignment"]]      = relationship("ProjectAssignment", back_populates="employee", cascade="all, delete-orphan")
    skills:              Mapped[List["EmployeeSkill"]]          = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    resume:              Mapped[Optional["ResumeMetadata"]]     = relationship("ResumeMetadata", back_populates="employee", foreign_keys="ResumeMetadata.employee_id", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "termination_date IS NULL OR termination_date >= hire_date",
            name="chk_termination_after_hire",
        ),
    )

    def __repr__(self) -> str:
        return f"<Employee {self.employee_code} – {self.first_name} {self.last_name}>"


# ---------------------------------------------------------------------------
# 2. Attendance
# ---------------------------------------------------------------------------

class Attendance(Base):
    __tablename__ = "attendance"

    id:              Mapped[uuid.UUID]          = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id:     Mapped[uuid.UUID]          = mapped_column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    attendance_date: Mapped[date]               = mapped_column(Date, nullable=False)
    check_in:        Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    check_out:       Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status:          Mapped[AttendanceStatus]   = mapped_column(
        Enum(AttendanceStatus, name="attendance_status"),
        nullable=False,
        default=AttendanceStatus.present,
    )
    overtime_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), default=0)
    location:       Mapped[Optional[str]]     = mapped_column(String(200))
    notes:          Mapped[Optional[str]]     = mapped_column(Text)
    approved_by:    Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    employee: Mapped["Employee"]           = relationship("Employee", back_populates="attendance_records", foreign_keys=[employee_id])
    approver: Mapped[Optional["Employee"]] = relationship("Employee", foreign_keys=[approved_by])

    __table_args__ = (
        UniqueConstraint("employee_id", "attendance_date", name="uq_attendance_employee_date"),
        CheckConstraint(
            "check_out IS NULL OR check_in IS NULL OR check_out >= check_in",
            name="chk_checkout_after_checkin",
        ),
    )

    def __repr__(self) -> str:
        return f"<Attendance employee={self.employee_id} date={self.attendance_date} status={self.status}>"


# ---------------------------------------------------------------------------
# 3. Project
# ---------------------------------------------------------------------------

class Project(Base):
    __tablename__ = "projects"

    id:           Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_code: Mapped[str]              = mapped_column(String(30), nullable=False, unique=True)
    name:         Mapped[str]              = mapped_column(String(200), nullable=False)
    description:  Mapped[Optional[str]]    = mapped_column(Text)
    client_name:  Mapped[Optional[str]]    = mapped_column(String(200))
    status:       Mapped[ProjectStatus]    = mapped_column(
        Enum(ProjectStatus, name="project_status"),
        nullable=False,
        default=ProjectStatus.planning,
    )
    start_date:     Mapped[Optional[date]]      = mapped_column(Date)
    end_date:       Mapped[Optional[date]]      = mapped_column(Date)
    budget:         Mapped[Optional[Decimal]]   = mapped_column(Numeric(15, 2))
    tech_stack:     Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    repository_url: Mapped[Optional[str]]       = mapped_column(Text)
    created_by:     Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    assignments: Mapped[List["ProjectAssignment"]] = relationship("ProjectAssignment", back_populates="project", cascade="all, delete-orphan")
    creator:     Mapped[Optional["Employee"]]      = relationship("Employee", foreign_keys=[created_by])

    __table_args__ = (
        CheckConstraint(
            "end_date IS NULL OR start_date IS NULL OR end_date >= start_date",
            name="chk_project_end_after_start",
        ),
    )

    def __repr__(self) -> str:
        return f"<Project {self.project_code} – {self.name}>"


# ---------------------------------------------------------------------------
# 3a. ProjectAssignment  (M:N join table)
# ---------------------------------------------------------------------------

class ProjectAssignment(Base):
    __tablename__ = "project_assignments"

    id:             Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id:     Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    employee_id:    Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    role:           Mapped[ProjectRole]     = mapped_column(
        Enum(ProjectRole, name="project_role"),
        nullable=False,
        default=ProjectRole.developer,
    )
    allocation_pct: Mapped[Optional[int]]   = mapped_column(SmallInteger, default=100)
    joined_date:    Mapped[date]            = mapped_column(Date, nullable=False, server_default=func.current_date())
    left_date:      Mapped[Optional[date]]  = mapped_column(Date)
    notes:          Mapped[Optional[str]]   = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    project:  Mapped["Project"]  = relationship("Project", back_populates="assignments")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="project_assignments")

    __table_args__ = (
        UniqueConstraint("project_id", "employee_id", name="uq_project_assignment"),
        CheckConstraint(
            "left_date IS NULL OR left_date >= joined_date",
            name="chk_left_after_joined",
        ),
        CheckConstraint(
            "allocation_pct BETWEEN 0 AND 100",
            name="chk_allocation_pct_range",
        ),
    )

    def __repr__(self) -> str:
        return f"<ProjectAssignment project={self.project_id} employee={self.employee_id} role={self.role}>"


# ---------------------------------------------------------------------------
# 4. Skill catalogue
# ---------------------------------------------------------------------------

class Skill(Base):
    __tablename__ = "skills"

    id:          Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name:        Mapped[str]           = mapped_column(CITEXT, nullable=False, unique=True)
    category:    Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at:  Mapped[datetime]      = mapped_column(server_default=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    employee_skills: Mapped[List["EmployeeSkill"]] = relationship("EmployeeSkill", back_populates="skill", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Skill {self.name} [{self.category}]>"


# ---------------------------------------------------------------------------
# 4b. EmployeeSkill  (M:N with proficiency)
# ---------------------------------------------------------------------------

class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id:               Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id:      Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    skill_id:         Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency:      Mapped[SkillProficiency] = mapped_column(
        Enum(SkillProficiency, name="skill_proficiency"),
        nullable=False,
        default=SkillProficiency.intermediate,
    )
    years_experience:   Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1))
    is_primary:         Mapped[bool]              = mapped_column(Boolean, nullable=False, default=False)
    certified:          Mapped[bool]              = mapped_column(Boolean, nullable=False, default=False)
    certification_name: Mapped[Optional[str]]     = mapped_column(String(200))
    certified_date:     Mapped[Optional[date]]    = mapped_column(Date)
    expiry_date:        Mapped[Optional[date]]    = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    employee: Mapped["Employee"] = relationship("Employee", back_populates="skills")
    skill:    Mapped["Skill"]   = relationship("Skill", back_populates="employee_skills")

    __table_args__ = (
        UniqueConstraint("employee_id", "skill_id", name="uq_employee_skill"),
    )

    def __repr__(self) -> str:
        return f"<EmployeeSkill employee={self.employee_id} skill={self.skill_id} level={self.proficiency}>"


# ---------------------------------------------------------------------------
# 5. ResumeMetadata
# ---------------------------------------------------------------------------

class ResumeMetadata(Base):
    __tablename__ = "resume_metadata"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    version:           Mapped[int]              = mapped_column(SmallInteger, nullable=False, default=1)
    file_name:         Mapped[Optional[str]]    = mapped_column(String(255))
    file_url:          Mapped[Optional[str]]    = mapped_column(Text)
    file_size_bytes:   Mapped[Optional[int]]    = mapped_column(BigInteger)
    mime_type:         Mapped[Optional[str]]    = mapped_column(String(100), default="application/pdf")
    summary:           Mapped[Optional[str]]    = mapped_column(Text)
    total_experience_yrs: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1))
    highest_education: Mapped[Optional[str]]    = mapped_column(String(200))
    languages:         Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    linkedin_url:      Mapped[Optional[str]]    = mapped_column(Text)
    github_url:        Mapped[Optional[str]]    = mapped_column(Text)
    portfolio_url:     Mapped[Optional[str]]    = mapped_column(Text)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    parsed_at:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_active:  Mapped[bool]              = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime]          = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime]          = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    employee: Mapped["Employee"]            = relationship("Employee", back_populates="resume", foreign_keys=[employee_id])
    uploader: Mapped[Optional["Employee"]]  = relationship("Employee", foreign_keys=[uploaded_by])
    history:  Mapped[List["ResumeHistory"]] = relationship("ResumeHistory", back_populates="resume", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ResumeMetadata employee={self.employee_id} v{self.version}>"


# ---------------------------------------------------------------------------
# 5b. ResumeHistory  (archive of older versions)
# ---------------------------------------------------------------------------

class ResumeHistory(Base):
    __tablename__ = "resume_history"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id:   Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("resume_metadata.id", ondelete="CASCADE"), nullable=False)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    version:     Mapped[int]       = mapped_column(SmallInteger, nullable=False)
    file_url:    Mapped[Optional[str]] = mapped_column(Text)
    archived_at: Mapped[datetime]  = mapped_column(server_default=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    resume:   Mapped["ResumeMetadata"] = relationship("ResumeMetadata", back_populates="history")
    employee: Mapped["Employee"]       = relationship("Employee", foreign_keys=[employee_id])

    def __repr__(self) -> str:
        return f"<ResumeHistory resume={self.resume_id} v{self.version}>"
