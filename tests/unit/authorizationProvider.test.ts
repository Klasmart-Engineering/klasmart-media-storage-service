import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import AuthorizationProvider from '../../src/providers/authorizationProvider'
import { PermissionApi } from '../../src/web/permissionApi'
import { Schedule, ScheduleApi } from '../../src/web/scheduleApi'

describe('authorizationProvider', () => {
  describe('isAuthorized', () => {
    context('endUserId is included in the list of teachers for roomId', () => {
      it('returns true', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const classId = 'my-class'
        const organizationId = 'my-org'
        const teacherIds = [endUserId]
        const authenticationToken = 'auth-token'
        const scheduleApi = Substitute.for<ScheduleApi>()
        const permissionApi = Substitute.for<PermissionApi>()
        const sut = new AuthorizationProvider(scheduleApi, permissionApi)

        const schedule: Schedule = {
          organizationId: organizationId,
          classId: classId,
          teacherIds: teacherIds,
        }
        scheduleApi.getRoomInfo(Arg.all()).resolves(schedule)

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(true)
      })
    })

    context(
      'endUserId is not included in the list of teachers for roomId; ' +
        'end user has the required permission',
      () => {
        it('returns true', async () => {
          // Arrange
          // ******* main difference ******* //
          const endUserId = 'teacher1'
          const teacherIds = ['teacher2']
          // ******* main difference ******* //
          const roomId = 'my-room'
          const classId = 'my-class'
          const organizationId = 'my-org'
          const authenticationToken = 'auth-token'
          const scheduleApi = Substitute.for<ScheduleApi>()
          const permissionApi = Substitute.for<PermissionApi>()
          const sut = new AuthorizationProvider(scheduleApi, permissionApi)

          const schedule: Schedule = {
            organizationId: organizationId,
            classId: classId,
            teacherIds: teacherIds,
          }
          scheduleApi.getRoomInfo(Arg.all()).resolves(schedule)

          permissionApi
            .hasSchoolOrOrganizationPermission(Arg.all())
            .resolves(true)

          // Act
          const actual = await sut.isAuthorized(
            endUserId,
            roomId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(true)
        })
      },
    )

    context(
      'endUserId is not included in the list of teachers for roomId; ' +
        'end user does not have the required permission',
      () => {
        it('returns false', async () => {
          // Arrange
          const endUserId = 'teacher1'
          const roomId = 'my-room'
          const classId = 'my-class'
          const organizationId = 'my-org'
          const teacherIds = ['teacher2']
          const authenticationToken = 'auth-token'
          const scheduleApi = Substitute.for<ScheduleApi>()
          const permissionApi = Substitute.for<PermissionApi>()
          const sut = new AuthorizationProvider(scheduleApi, permissionApi)

          const schedule: Schedule = {
            organizationId: organizationId,
            classId: classId,
            teacherIds: teacherIds,
          }
          scheduleApi.getRoomInfo(Arg.all()).resolves(schedule)

          // ******* main difference ******* //
          permissionApi
            .hasSchoolOrOrganizationPermission(Arg.all())
            .resolves(false)
          // ******* main difference ******* //

          // Act
          const actual = await sut.isAuthorized(
            endUserId,
            roomId,
            authenticationToken,
          )

          // Assert
          expect(actual).to.equal(false)
        })
      },
    )

    context('endUserId is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = undefined
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const scheduleApi = Substitute.for<ScheduleApi>()
        const permissionApi = Substitute.for<PermissionApi>()
        const sut = new AuthorizationProvider(scheduleApi, permissionApi)

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context('roomId is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = undefined
        const authenticationToken = 'auth-token'
        const scheduleApi = Substitute.for<ScheduleApi>()
        const permissionApi = Substitute.for<PermissionApi>()
        const sut = new AuthorizationProvider(scheduleApi, permissionApi)

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context('authenticationToken is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = undefined
        const scheduleApi = Substitute.for<ScheduleApi>()
        const permissionApi = Substitute.for<PermissionApi>()
        const sut = new AuthorizationProvider(scheduleApi, permissionApi)

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })

    context('returned roomInfo is undefined', () => {
      it('returns false', async () => {
        // Arrange
        const endUserId = 'teacher1'
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const scheduleApi = Substitute.for<ScheduleApi>()
        const permissionApi = Substitute.for<PermissionApi>()
        const sut = new AuthorizationProvider(scheduleApi, permissionApi)

        const schedule = undefined
        scheduleApi.getRoomInfo(Arg.all()).resolves(schedule)

        // Act
        const actual = await sut.isAuthorized(
          endUserId,
          roomId,
          authenticationToken,
        )

        // Assert
        expect(actual).to.equal(false)
      })
    })
  })
})
