"""Admin domain management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime

from ...db.base import get_db
from ...models import DomainWhitelist, User
from ...schemas.admin import (
    DomainsListResponse,
    DomainInfo,
    AddDomainRequest,
    AddDomainResponse,
    RemoveDomainRequest
)
from .users import require_admin
from ...models import Session as SessionModel

router = APIRouter()


@router.get("/domains", response_model=DomainsListResponse)
async def get_domains(
    db: AsyncSession = Depends(get_db),
    admin_session: SessionModel = Depends(require_admin)
):
    """
    Get all allowed domains.

    Admin only endpoint.
    """
    # Get all domains with user count
    domains_query = select(
        DomainWhitelist,
        func.count(User.id).label("user_count")
    ).outerjoin(
        User,
        func.split_part(User.email, '@', 2) == DomainWhitelist.domain
    ).group_by(DomainWhitelist.domain)

    result = await db.execute(domains_query)
    domains_data = result.all()

    # Build response
    domains_list = []
    for domain_obj, user_count in domains_data:
        domains_list.append(DomainInfo(
            domain=domain_obj.domain,
            addedAt=domain_obj.added_at,
            addedBy=domain_obj.added_by,
            status=domain_obj.status,
            userCount=user_count or 0
        ))

    return DomainsListResponse(
        domains=domains_list,
        total=len(domains_list)
    )


@router.post("/domains", response_model=AddDomainResponse)
async def add_domain(
    add_data: AddDomainRequest,
    db: AsyncSession = Depends(get_db),
    admin_session: SessionModel = Depends(require_admin)
):
    """
    Add a new allowed domain.

    Admin only endpoint.
    """
    # Check if domain already exists
    result = await db.execute(
        select(DomainWhitelist).where(DomainWhitelist.domain == add_data.domain)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain already exists"
        )

    # Add new domain
    new_domain = DomainWhitelist(
        domain=add_data.domain.lower(),
        added_at=datetime.utcnow(),
        added_by=admin_session.user.email
    )

    db.add(new_domain)
    await db.commit()
    await db.refresh(new_domain)

    return AddDomainResponse(
        success=True,
        domain=DomainInfo(
            domain=new_domain.domain,
            addedAt=new_domain.added_at,
            addedBy=new_domain.added_by,
            status=new_domain.status,
            userCount=0
        )
    )


@router.delete("/domains")
async def remove_domain(
    remove_data: RemoveDomainRequest,
    db: AsyncSession = Depends(get_db),
    admin_session: SessionModel = Depends(require_admin)
):
    """
    Remove an allowed domain.

    Admin only endpoint.
    """
    # Don't allow removing the admin's domain
    admin_domain = admin_session.user.email.split("@")[1]
    if remove_data.domain == admin_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own domain"
        )

    # Find and remove domain
    result = await db.execute(
        select(DomainWhitelist).where(DomainWhitelist.domain == remove_data.domain)
    )
    domain = result.scalar_one_or_none()

    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )

    await db.delete(domain)
    await db.commit()

    return {
        "success": True,
        "removedDomain": remove_data.domain
    }