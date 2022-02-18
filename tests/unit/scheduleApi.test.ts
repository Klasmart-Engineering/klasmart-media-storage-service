import { AxiosStatic, AxiosResponse } from 'axios'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { Schedule, ScheduleApi } from '../../src/web/scheduleApi'
import { ScheduleDto } from '../../src/web/scheduleResponse'

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

    context('response status is not 200', () => {
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

    context('response status is 200 but payload is undefined', () => {
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
  })
})

const scheduleDto: ScheduleDto = {
  id: 'my-room',
  org_id: 'org1',
  class_roster_class_id: 'class1',
  class_roster_teacher_ids: ['teacher1', 'teacher2'],
  participant_teacher_ids: [],
}
const schedule: Schedule = {
  id: 'my-room',
  organizationId: 'org1',
  classId: 'class1',
  teacherIds: ['teacher1', 'teacher2'],
}