import { withLogger } from 'kidsloop-nodejs-logger'
import { IAuthorizationProvider } from '../interfaces/authorizationProvider'
import { ScheduleApi } from '../web/scheduleApi'
import { PermissionApi } from '../web/permissionApi'

const logger = withLogger('AuthorizationProvider')

export default class AuthorizationProvider implements IAuthorizationProvider {
  constructor(
    private readonly scheduleApi: ScheduleApi,
    private readonly permissionApi: PermissionApi,
  ) {}

  public async isAuthorized(
    endUserId: string | undefined,
    roomId: string | undefined,
    authenticationToken: string | undefined,
  ): Promise<boolean> {
    if (!endUserId) {
      logger.debug(`[isAuthorized] endUserId is falsy`)
      return false
    }
    if (!roomId) {
      logger.debug(`[isAuthorized] roomId is falsy`)
      return false
    }
    if (!authenticationToken) {
      logger.debug(`[isAuthorized] authenticationToken is falsy`)
      return false
    }
    const roomInfo = await this.scheduleApi.getRoomInfo(
      roomId,
      authenticationToken,
    )
    if (!roomInfo) {
      logger.debug(
        `[isAuthorized] scheduleApi.getRoomInfo(${roomId}) result: falsy`,
      )
      return false
    }
    const teacherIds = roomInfo.teacherIds.join(',')
    logger.debug(
      `[isAuthorized] endUserId: ${endUserId}; roomId: ${roomId}; roomInfo.teacherIds: ${teacherIds}`,
    )
    if (roomInfo.teacherIds.includes(endUserId)) {
      return true
    }
    const hasSchoolOrOrganizationPermission =
      await this.permissionApi.hasSchoolOrOrganizationPermission(
        roomInfo.organizationId,
        roomInfo.classId,
        endUserId,
        authenticationToken,
      )
    if (hasSchoolOrOrganizationPermission) {
      logger.silly(`[isAuthorized] hasSchoolOrOrganizationPermission is true`)
      return true
    }
    return false
  }
}
