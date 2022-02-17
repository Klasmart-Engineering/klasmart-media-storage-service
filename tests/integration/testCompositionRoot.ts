import Substitute from '@fluffy-spoon/substitute'
import AuthorizationProvider from '../../src/helpers/authorizationProvider'
import { CompositionRoot } from '../../src/initialization/compositionRoot'
import { IAuthorizationProvider } from '../../src/interfaces/authorizationProvider'
import { ScheduleApi } from '../../src/web/scheduleApi'
import { PermissionApi } from '../../src/web/permissionApi'

export class TestCompositionRoot extends CompositionRoot {
  public authorizationProvider = Substitute.for<AuthorizationProvider>()
  public scheduleApi?: ScheduleApi
  public permissionApi?: PermissionApi

  protected getAuthorizationProvider(): IAuthorizationProvider {
    return this.authorizationProvider ?? super.getAuthorizationProvider()
  }

  protected getScheduleApi(): ScheduleApi {
    return this.scheduleApi ?? super.getScheduleApi()
  }

  protected getPermissionApi(): PermissionApi {
    return this.permissionApi ?? super.getPermissionApi()
  }

  public async clearCachedResolvers() {
    this.audioResolver = undefined
    await this.redis?.flushall()
    await this.typeorm?.synchronize(true)
  }
}
