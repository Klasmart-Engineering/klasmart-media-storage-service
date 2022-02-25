import { AxiosStatic, AxiosResponse, AxiosError } from 'axios'
import { withLogger } from 'kidsloop-nodejs-logger'
import { ScheduleDto } from './scheduleResponse'
import { throwExpression } from '../helpers/throwExpression'

const logger = withLogger('ScheduleApi')

export class ScheduleApi {
  public constructor(
    private readonly axios: AxiosStatic,
    private readonly baseUrl: string,
  ) {}

  public async getRoomInfo(
    roomId: string,
    authenticationToken: string,
  ): Promise<Schedule | undefined> {
    const requestUrl = `${this.baseUrl}/schedules/${roomId}/relation_ids`

    let response: AxiosResponse<ScheduleDto> | undefined
    try {
      response = await this.axios.get<ScheduleDto>(requestUrl, {
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : error
      logger.error(`error: ${errorMessage}; endpoint: ${requestUrl}`)
    }

    const dto = response?.data
    if (dto == null) {
      return undefined
    }

    const entity = mapDtoToEntity(dto)

    return entity
  }
}

function mapDtoToEntity(dto: ScheduleDto) {
  return new Schedule(
    dto.org_id ?? throwExpression('schedule.org_id is undefined'),
    dto.class_roster_class_id ??
      throwExpression('schedule.class_roster_class_id is undefined'),
    dto.class_roster_teacher_ids ??
      throwExpression('schedule.class_roster_teacher_ids is undefined'),
  )
}

export class Schedule {
  constructor(
    public readonly organizationId: string,
    public readonly classId: string,
    public readonly teacherIds: ReadonlyArray<string>,
  ) {}
}
