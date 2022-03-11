import Substitute from '@fluffy-spoon/substitute'
import AuthorizationProvider from '../../src/providers/authorizationProvider'
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

  public async reset() {
    await this.redis?.flushall()
    await this.typeorm?.synchronize(true)
    // Resolvers
    this.downloadResolver = undefined
    this.metadataResolver = undefined
    this.uploadResolver = undefined
    // Resolver dependencies
    this.keyPairProvider = undefined
    this.presignedUrlProvider = undefined
    // Don't set typeorm or redis to undefined.
    // Those have open connections that will be closed
    // when cleanUp() is called.
  }
}
