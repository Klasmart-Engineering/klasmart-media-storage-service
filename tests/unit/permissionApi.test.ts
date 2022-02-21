import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { ClientError, GraphQLClient } from 'graphql-request'
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
        const endUserId = 'my-user'
        const roomId = 'my-room'
        const classId = 'my-class'
        const authenticationToken = 'auth-token'
        const graphQLClient = Substitute.for<GraphQLClient>()
        const sut = new PermissionApi(graphQLClient)

        const orgPermissionResponse: OrgPermissionResponse = {
          myUser: { hasPermissionsInOrganization: [{ allowed: true }] },
        }
        graphQLClient.request(Arg.all()).resolves(orgPermissionResponse)

        // Act
        const actual = await sut.hasSchoolOrOrganizationPermission(
          roomId,
          classId,
          endUserId,
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
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const classId = 'my-class'
          const schoolId = 'my-school'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          const schoolPermissionResponse: SchoolPermissionResponse = {
            myUser: { hasPermissionsInSchool: [{ allowed: true }] },
          }
          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .resolves(schoolPermissionResponse)

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(true)
        })
      },
    )

    context(
      'organization permission check returns false, and returns 2 schools; first has permission, second does not',
      () => {
        it('returns true', async () => {
          // Arrange
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const classId = 'my-class'
          const school1Id = 'my-school1'
          const school2Id = 'my-school2'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
            classNode: {
              schoolsConnection: {
                edges: [
                  { node: { id: school1Id } },
                  { node: { id: school2Id } },
                ],
              },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          const schoolPermissionResponse: SchoolPermissionResponse = {
            myUser: { hasPermissionsInSchool: [{ allowed: true }] },
          }
          graphQLClient
            .request(
              GET_HAS_SCHOOL_PERMISSION,
              Arg.is((x) => JSON.stringify(x).includes(school1Id)),
              Arg.any(),
            )
            .resolves(schoolPermissionResponse)

          const school2PermissionResponse: SchoolPermissionResponse = {
            myUser: { hasPermissionsInSchool: [{ allowed: false }] },
          }
          graphQLClient
            .request(
              GET_HAS_SCHOOL_PERMISSION,
              Arg.is((x) => JSON.stringify(x).includes(school2Id)),
              Arg.any(),
            )
            .resolves(school2PermissionResponse)

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
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
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const classId = 'my-class'
          const schoolId = 'my-school'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          const schoolPermissionResponse: SchoolPermissionResponse = {
            myUser: { hasPermissionsInSchool: [{ allowed: false }] },
          }
          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .resolves(schoolPermissionResponse)

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
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
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const classId = 'my-class'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
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
            endUserId,
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

    context(
      'organization permission check throws GraphQL ClientError; hasPermissionsInOrganization ' +
        'returns true; classNode throws an error',
      () => {
        it('returns true', async () => {
          // Arrange
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const classId = '03ecb0dd-f765-4c76-9778-272f575c21f6'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          graphQLClient
            .request(Arg.all())
            .rejects(
              new ClientError(JSON.parse(PARTIAL_ERROR_RESPONSE), Arg.any()),
            )

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(true)
        })
      },
    )

    context('organization permission check throws an error', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'my-user'
        const roomId = 'my-room'
        const classId = '03ecb0dd-f765-4c76-9778-272f575c21f6'
        const authenticationToken = 'auth-token'
        const graphQLClient = Substitute.for<GraphQLClient>()
        const sut = new PermissionApi(graphQLClient)

        graphQLClient.request(Arg.all()).rejects(new Error('Unauthorized!'))

        // Act
        const actual = await sut.hasSchoolOrOrganizationPermission(
          roomId,
          classId,
          endUserId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context('organization permission check throws a string', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'my-user'
        const roomId = 'my-room'
        const classId = '03ecb0dd-f765-4c76-9778-272f575c21f6'
        const authenticationToken = 'auth-token'
        const graphQLClient = Substitute.for<GraphQLClient>()
        const sut = new PermissionApi(graphQLClient)

        graphQLClient.request(Arg.all()).rejects('Unauthorized!')

        // Act
        const actual = await sut.hasSchoolOrOrganizationPermission(
          roomId,
          classId,
          endUserId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context(
      'organization permission check returns false; school permission check throws GraphQL ClientError',
      () => {
        it('returns false', async () => {
          // Arrange
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const schoolId = 'my-school'
          const classId = '03ecb0dd-f765-4c76-9778-272f575c21f6'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .rejects(
              new ClientError(JSON.parse(PARTIAL_ERROR_RESPONSE), Arg.any()),
            )

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
        })
      },
    )

    context(
      'organization permission check returns false; school permission check throws an error',
      () => {
        it('returns false', async () => {
          // Arrange
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const schoolId = 'my-school'
          const classId = '03ecb0dd-f765-4c76-9778-272f575c21f6'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .rejects(new Error('Internal server error'))

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
        })
      },
    )

    context(
      'organization permission check returns false; school permission check throws a string',
      () => {
        it('returns false', async () => {
          // Arrange
          const endUserId = 'my-user'
          const roomId = 'my-room'
          const schoolId = 'my-school'
          const classId = '03ecb0dd-f765-4c76-9778-272f575c21f6'
          const authenticationToken = 'auth-token'
          const graphQLClient = Substitute.for<GraphQLClient>()
          const sut = new PermissionApi(graphQLClient)

          const orgPermissionResponse: OrgPermissionResponse = {
            myUser: { hasPermissionsInOrganization: [{ allowed: false }] },
            classNode: {
              schoolsConnection: { edges: [{ node: { id: schoolId } }] },
            },
          }
          graphQLClient
            .request(GET_HAS_ORG_PERMISSION, Arg.any(), Arg.any())
            .resolves(orgPermissionResponse)

          graphQLClient
            .request(GET_HAS_SCHOOL_PERMISSION, Arg.any(), Arg.any())
            .rejects('Internal server error')

          // Act
          const actual = await sut.hasSchoolOrOrganizationPermission(
            roomId,
            classId,
            endUserId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
        })
      },
    )
  })
})

const PARTIAL_ERROR_RESPONSE = `
{
  "errors": [
    {
      "message": "ClassConnectionNode 03ecb0dd-f765-4c76-9778-272f575c21f6 doesn't exist.",
      "locations": [
        {
          "line": 11,
          "column": 5
        }
      ],
      "path": [
        "classNode"
      ],
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR",
        "exception": {
          "code": "ERR_NON_EXISTENT_ENTITY",
          "variables": [
            "id"
          ],
          "message": "ClassConnectionNode 03ecb0dd-f765-4c76-9778-272f575c21f6 doesn't exist.",
          "entity": "ClassConnectionNode",
          "entityName": "03ecb0dd-f765-4c76-9778-272f575c21f6"
        }
      }
    }
  ],
  "data": {
    "myUser": {
      "hasPermissionsInOrganization": [
        {
          "allowed": true
        }
      ]
    },
    "classNode": null
  },
  "status": 200,
  "headers": {}
}
`
