import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { CustomIocContainer } from '../../../src/initialization/buildDefaultSchema'
import { CompositionRoot } from '../../../src/initialization/compositionRoot'
import { DownloadResolver } from '../../../src/resolvers/downloadResolver'
import { MetadataResolver } from '../../../src/resolvers/metadataResolver'
import { UploadResolver } from '../../../src/resolvers/uploadResolver'

describe('CustomIocContainer.get', () => {
  context('objectType is MetadataResolver', () => {
    it('returns instance of MetadataResolver', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const metadataResolver = Substitute.for<MetadataResolver>()
      compositionRoot.getMetadataResolver().returns(metadataResolver)

      // Act
      const actual = await sut.get(MetadataResolver)

      // Assert
      expect(actual).to.equal(metadataResolver)
    })
  })

  context('objectType is UploadResolver', () => {
    it('returns instance of UploadResolver', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const uploadResolver = Substitute.for<UploadResolver>()
      compositionRoot.getUploadResolver().returns(uploadResolver)

      // Act
      const actual = await sut.get(UploadResolver)

      // Assert
      expect(actual).to.equal(uploadResolver)
    })
  })

  context('objectType is DownloadResolver', () => {
    it('returns instance of DownloadResolver', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const downloadResolver = Substitute.for<DownloadResolver>()
      compositionRoot.getDownloadResolver().returns(downloadResolver)

      // Act
      const actual = await sut.get(DownloadResolver)

      // Assert
      expect(actual).to.equal(downloadResolver)
    })
  })

  context('objectType is not a known resolver', () => {
    it('returns undefined', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const downloadResolver = Substitute.for<DownloadResolver>()
      compositionRoot.getDownloadResolver().returns(downloadResolver)

      // Act
      const actual = await sut.get(CompositionRoot)

      // Assert
      expect(actual).to.be.undefined
    })
  })
})
