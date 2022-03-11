import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { CustomIocContainer } from '../../../src/initialization/buildDefaultSchema'
import { CompositionRoot } from '../../../src/initialization/compositionRoot'
import { DownloadResolver } from '../../../src/resolvers/downloadResolver'

describe('CustomIocContainer.get', () => {
  context('objectType is MediaResolver', () => {
    it('returns instance of MediaResolver', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const mediaResolver = Substitute.for<DownloadResolver>()
      compositionRoot.getDownloadResolver().resolves(mediaResolver)

      // Act
      const actual = await sut.get(DownloadResolver)

      // Assert
      expect(actual).to.equal(mediaResolver)
    })
  })

  context('objectType is not MediaResolver', () => {
    it('returns undefined', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const mediaResolver = Substitute.for<DownloadResolver>()
      compositionRoot.getDownloadResolver().resolves(mediaResolver)

      // Act
      const actual = await sut.get(CompositionRoot)

      // Assert
      expect(actual).to.be.undefined
    })
  })
})
