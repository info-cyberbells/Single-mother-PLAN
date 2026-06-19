import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { toPartnerOrganization } from '../../utils/partner-organization.utils';

export class PartnerOrgService {
  async completeOnboarding(
    orgId: string,
    data: {
      // profile
      name?: string;
      tagline?: string;
      description?: string;
      website?: string;
      linkedin?: string;
      services?: string;
      // location
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      email?: string;
      phone?: string;
      service_area?: string;
      // preferences
      primary_language?: string;
      notification_frequency?: string;
      case_numbering_prefix?: string;
    }
  ) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundError('Organization not found');

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(data.name          && { org_name:      data.name }),
        ...(data.tagline       !== undefined && { tagline:       data.tagline || null }),
        ...(data.description   !== undefined && {
          description: data.description || null,
          purpose:     data.description || null,
        }),
        ...(data.website       !== undefined && { website:       data.website || null }),
        ...(data.linkedin      !== undefined && { linkedin:      data.linkedin || null }),
        ...(data.services      !== undefined && { services_offered: data.services || null }),
        ...(data.address       !== undefined && { address:       data.address || null }),
        ...(data.city          !== undefined && { city:          data.city || null }),
        ...(data.state         !== undefined && { state:         data.state || null }),
        ...(data.zip           !== undefined && { zip_code:      data.zip || null }),
        ...(data.country       !== undefined && { country:       data.country || null }),
        ...(data.email         !== undefined && {
          contact_email: data.email || null,
          email:         data.email || null,
        }),
        ...(data.phone         !== undefined && { phone:         data.phone || null }),
        ...(data.service_area  !== undefined && { service_area:  data.service_area || null }),
        ...(data.primary_language       !== undefined && { primary_language:       data.primary_language }),
        ...(data.notification_frequency !== undefined && { notification_frequency: data.notification_frequency }),
        ...(data.case_numbering_prefix  !== undefined && { case_numbering_prefix:  data.case_numbering_prefix }),
        onboarding_completed: true,
      },
    });

    return toPartnerOrganization(updated);
  }

  async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundError('Organization not found');
    return toPartnerOrganization(org);
  }
}
