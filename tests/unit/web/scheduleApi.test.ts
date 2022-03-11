import { AxiosStatic, AxiosResponse } from 'axios'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { Schedule, ScheduleApi } from '../../../src/web/scheduleApi'
import { ScheduleDto } from '../../../src/web/scheduleResponse'

describe('scheduleApi', () => {
  describe('getRoomInfo', () => {
    context('schedule exists matching roomId', () => {
      it('returns corresponding schedule item', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)

        const response: AxiosResponse = {
          status: 200,
          data: scheduleDto,
          statusText: Arg.any(),
          config: Arg.any(),
          headers: Arg.any(),
        }
        axiosClient.get(Arg.all()).resolves(response)

        // Act
        const actual = await sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        expect(actual).to.deep.equal(schedule)
      })
    })

    context('response status is not 200; string thrown', () => {
      it('returns undefined', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)

        axiosClient
          .get(Arg.all())
          .rejects('Request failed with status code 401')

        // Act
        const actual = await sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        expect(actual).to.be.undefined
      })
    })

    context('response status is not 200; error thrown', () => {
      it('returns undefined', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)

        axiosClient
          .get(Arg.all())
          .rejects(new Error('Request failed with status code 401'))

        // Act
        const actual = await sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        expect(actual).to.be.undefined
      })
    })

    context('response status is 200 but payload is nullish', () => {
      it('returns undefined', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)

        const response: AxiosResponse = {
          status: 403,
          data: undefined,
          statusText: Arg.any(),
          config: Arg.any(),
          headers: Arg.any(),
        }
        axiosClient.get(Arg.all()).resolves(response)

        // Act
        const actual = await sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        expect(actual).to.be.undefined
      })
    })

    context('ScheduleDto.org_id is nullish', () => {
      it('throws error', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)
        const dto: ScheduleDto = { ...scheduleDto, org_id: undefined }

        const response: AxiosResponse = {
          status: 200,
          data: dto,
          statusText: Arg.any(),
          config: Arg.any(),
          headers: Arg.any(),
        }
        axiosClient.get(Arg.all()).resolves(response)

        // Act
        const fn = () => sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        await expect(fn()).to.be.rejectedWith('schedule.org_id is nullish')
      })
    })

    context('ScheduleDto.class_roster_class_id is nullish', () => {
      it('throws error', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)
        const dto: ScheduleDto = {
          ...scheduleDto,
          class_roster_class_id: undefined,
        }

        const response: AxiosResponse = {
          status: 200,
          data: dto,
          statusText: Arg.any(),
          config: Arg.any(),
          headers: Arg.any(),
        }
        axiosClient.get(Arg.all()).resolves(response)

        // Act
        const fn = () => sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        await expect(fn()).to.be.rejectedWith(
          'schedule.class_roster_class_id is nullish',
        )
      })
    })

    context('ScheduleDto.class_roster_teacher_ids is nullish', () => {
      it('throws error', async () => {
        // Arrange
        const roomId = 'my-room'
        const authenticationToken = 'auth-token'
        const baseUrl = 'https://dummy.kidsloop.live'
        const axiosClient = Substitute.for<AxiosStatic>()
        const sut = new ScheduleApi(axiosClient, baseUrl)
        const dto: ScheduleDto = {
          ...scheduleDto,
          class_roster_teacher_ids: undefined,
        }

        const response: AxiosResponse = {
          status: 200,
          data: dto,
          statusText: Arg.any(),
          config: Arg.any(),
          headers: Arg.any(),
        }
        axiosClient.get(Arg.all()).resolves(response)

        // Act
        const fn = () => sut.getRoomInfo(roomId, authenticationToken)

        // Assert
        await expect(fn()).to.be.rejectedWith(
          'schedule.class_roster_teacher_ids is nullish',
        )
      })
    })
  })
})

const scheduleDto: ScheduleDto = {
  org_id: 'org1',
  class_roster_class_id: 'class1',
  class_roster_teacher_ids: ['teacher1', 'teacher2'],
  participant_teacher_ids: [],
}
const schedule: Schedule = {
  organizationId: 'org1',
  classId: 'class1',
  teacherIds: ['teacher1', 'teacher2'],
}
