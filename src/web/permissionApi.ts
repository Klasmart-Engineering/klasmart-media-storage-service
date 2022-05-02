import { ClientError, gql, GraphQLClient } from 'graphql-request'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('PermissionApi')

const PERMISSION_ID = 'view_completed_assessments_414'

export class PermissionApi {
  constructor(private readonly client: GraphQLClient) {}

  public async hasSchoolOrOrganizationPermission(
    organizationId: string,
    classId: string,
    endUserId: string,
    authenticationToken: string,
  ): Promise<boolean> {
    const requestHeaders = {
      authorization: authenticationToken,
    }

    let orgPermissionResponse: OrgPermissionResponse | undefined
    try {
      orgPermissionResponse = await this.client.request<OrgPermissionResponse>(
        GET_HAS_ORG_PERMISSION,
        { organizationId, classId, permissionId: PERMISSION_ID },
        requestHeaders,
      )
    } catch (error) {
      let errorText: unknown
      if (error instanceof ClientError) {
        // classNode throws a "doesn't exist" error if the end user doesn't have permission
        // to access a given class. In that case, the orgPermissionResponse can still succeed.
        orgPermissionResponse = error.response.data as OrgPermissionResponse
        if (orgPermissionResponse?.myUser) {
          logger.debug(
            `[hasSchoolOrOrganizationPermission] class either doesn't exist or user doesn't ` +
              'have permission to access it.',
            { endUserId, classId },
          )
        } else {
          errorText = error.response.errors
        }
      } else if (error instanceof Error) {
        errorText = error.message
      } else {
        errorText = error
      }
      if (errorText) {
        logger.error(
          '[hasSchoolOrOrganizationPermission] organization permission denied.',
          { error: errorText },
        )
      }
    }

    if (
      orgPermissionResponse?.myUser?.hasPermissionsInOrganization?.[0].allowed
    ) {
      return true
    }

    const schoolId = extractSchoolId(classId, orgPermissionResponse?.classNode)
    if (schoolId == null) {
      return false
    }

    let schoolPermissionResponse: SchoolPermissionResponse | undefined
    try {
      schoolPermissionResponse =
        await this.client.request<SchoolPermissionResponse>(
          GET_HAS_SCHOOL_PERMISSION,
          { schoolId, permissionId: PERMISSION_ID },
          requestHeaders,
        )
    } catch (error) {
      let errorText: unknown
      if (error instanceof ClientError) {
        errorText = error.response.errors
      } else if (error instanceof Error) {
        errorText = error.message
      } else {
        errorText = error
      }
      logger.error(
        '[hasSchoolOrOrganizationPermission] school permission denied.',
        { error: errorText },
      )
    }

    return (
      schoolPermissionResponse?.myUser?.hasPermissionsInSchool?.[0]?.allowed ??
      false
    )
  }
}

function extractSchoolId(
  classId: string,
  classNode: SchoolFromClassResult | undefined,
): string | undefined {
  const schools = classNode?.schoolsConnection?.edges
  if (schools == null || schools.length == 0) {
    logger.debug(
      '[extractSchoolId] classNode?.schoolsConnection?.edges is undefined or empty',
    )
    return undefined
  }
  let school: { node?: { id?: string } }
  if (schools.length > 1) {
    logger.debug(
      `[extractSchoolId] more than one school associated with class: ${schools.length}`,
      {
        schools: schools.join(','),
        classId,
      },
    )
    school = schools[0]
  } else {
    school = schools[0]
  }

  return school.node?.id
}

export const GET_HAS_ORG_PERMISSION = gql`
  query Query($organizationId: ID!, $classId: ID!, $permissionId: String!) {
    myUser {
      hasPermissionsInOrganization(
        organizationId: $organizationId
        permissionIds: [$permissionId]
      ) {
        permissionId
        allowed
      }
    }
    classNode(id: $classId) {
      schoolsConnection {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`

export const GET_HAS_SCHOOL_PERMISSION = gql`
  query Query($schoolId: ID!, $permissionId: String!) {
    myUser {
      hasPermissionsInSchool(
        schoolId: $schoolId
        permissionIds: [$permissionId]
      ) {
        permissionId
        allowed
      }
    }
  }
`

export interface SchoolPermissionResponse {
  myUser: {
    hasPermissionsInSchool?: { allowed?: boolean }[]
  }
}

export interface OrgPermissionResponse {
  myUser?: {
    hasPermissionsInOrganization?: { allowed?: boolean }[]
  }
  classNode?: SchoolFromClassResult
}

interface SchoolFromClassResult {
  schoolsConnection?: { edges?: { node?: { id?: string } }[] }
}
