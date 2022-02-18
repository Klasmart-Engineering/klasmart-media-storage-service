import { ClientError, gql, GraphQLClient } from 'graphql-request'
import { withLogger } from 'kidsloop-nodejs-logger'

const logger = withLogger('PermissionApi')

const PERMISSION_ID = 'view_completed_assessments_414'

export class PermissionApi {
  constructor(private readonly client: GraphQLClient) {}

  public async hasSchoolOrOrganizationPermission(
    organizationId: string,
    classId: string,
    authenticationToken: string,
  ): Promise<boolean> {
    const requestHeaders = {
      authorization: authenticationToken,
    }

    let orgPermissionResponse: OrgPermissionResponse | undefined
    try {
      orgPermissionResponse = await this.client.request<OrgPermissionResponse>(
        GET_HAS_ORG_PERMISSION,
        { organizationId, classId, PERMISSION_ID },
        requestHeaders,
      )
    } catch (error) {
      if (error instanceof ClientError) {
        logger.error(
          `[hasSchoolOrOrganizationPermission] organization permission check:\n` +
            JSON.stringify(error.response, null, 2),
        )
        orgPermissionResponse = error.response.data as OrgPermissionResponse
      } else if (error instanceof Error) {
        logger.error(
          `[hasSchoolOrOrganizationPermission] organization permission check:\n` +
            JSON.stringify(error, null, 2),
        )
      } else {
        logger.error(
          `[hasSchoolOrOrganizationPermission] organization permission check:\n${error}`,
        )
      }
    }

    if (orgPermissionResponse?.myUser?.hasPermissionsInOrganization?.allowed) {
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
          { schoolId, PERMISSION_ID },
          requestHeaders,
        )
    } catch (error) {
      if (error instanceof ClientError) {
        logger.error(
          `[hasSchoolOrOrganizationPermission] school permission check:\n` +
            JSON.stringify(error.response, null, 2),
        )
      } else if (error instanceof Error) {
        logger.error(
          `[hasSchoolOrOrganizationPermission] school permission check:\n` +
            JSON.stringify(error, null, 2),
        )
      } else {
        logger.error(
          `[hasSchoolOrOrganizationPermission] school permission check:\n${error}`,
        )
      }
    }

    return (
      schoolPermissionResponse?.myUser?.hasPermissionsInSchool?.allowed ?? false
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
      `[extractSchoolId] more than one school associated with class: ${schools.length}\n` +
        `schools: ${schools.join(',')}` +
        `class: ${classId}`,
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
        allowed
      }
    }
  }
`

export interface SchoolPermissionResponse {
  myUser: {
    hasPermissionsInSchool?: { allowed?: boolean }
  }
}

export interface OrgPermissionResponse {
  myUser?: {
    hasPermissionsInOrganization?: { allowed?: boolean }
  }
  classNode?: SchoolFromClassResult
}

interface SchoolFromClassResult {
  schoolsConnection?: { edges?: { node?: { id?: string } }[] }
}
