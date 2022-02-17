import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { GraphQLClient } from 'graphql-request'
import {
  GET_HAS_ORG_PERMISSION,
  GET_HAS_SCHOOL_PERMISSION,
  OrgPermissionResponse,
  PermissionApi,
  SchoolPermissionResponse,
} from '../../src/web/permissionApi'

describe('permissionApi', () => {
  describe('hasSchoolOrOrganizationPermission', () => {
    context('organization permission check returns true', () => {
      it('returns true', async () => {
        // Arrange
        const roomId = 'my-room'
        const classId = 'my-class'
        const authenticationToken = 'auth-token'
        const graphQLClient = Substitute.for<GraphQLClient>()
        const sut = new PermissionApi(graphQLClient)

        const orgPermissionResponse: OrgPermissionResponse = {
          myUser: { hasPermissionsInOrganization: { allowed: true } },
        }
        graphQLClient.request(Arg.all()).resolves(orgPermissionResponse)

        // Act
        const actual = await sut.hasSchoolOrOrganizationPermission(
          roomId,
          classId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(true)
      })
    })

    context(
      'organization permission check returns false; school permission check returns true',
      () => {
        it('returns true', async () => {
          // Arrange
          const roomId = 'my-room'
          const classId = 'my-class'
          const schoolId = 'my-school'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: { allowed: false } },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          const schoolPermissionResponse: SchoolPermissionResponse = {
            myUser: { hasPermissionsInSchool: { allowed: true } },
          }
          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .resolves(schoolPermissionResponse)

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(true)
        })
      },
    )

    context(
      'organization permission check returns false; school permission check returns false',
      () => {
        it('returns false', async () => {
          // Arrange
          const roomId = 'my-room'
          const classId = 'my-class'
          const schoolId = 'my-school'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: { allowed: false } },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          const schoolPermissionResponse: SchoolPermissionResponse = {
            myUser: { hasPermissionsInSchool: { allowed: false } },
          }
          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .resolves(schoolPermissionResponse)

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
        })
      },
    )

    context(
      'organization permission check returns false and empty classNode.schoolsConnection.edges; ' +
        'school permission check returns false',
      () => {
        it('returns false', async () => {
          // Arrange
          const roomId = 'my-room'
          const classId = 'my-class'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: { allowed: false } },
            classNode: {
              // ******* main difference ******* //
              schoolsConnection: { edges: [] },
              // ******* main difference ******* //
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
          graphQLClient
            .didNotReceive()
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
        })
      },
    )
  })
})
